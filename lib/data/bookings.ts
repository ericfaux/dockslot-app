/**
 * DockSlot Booking Data Layer
 * Database queries and data access functions
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  AvailabilityWindow,
  Booking,
  BookingWithDetails,
  BookingLog,
  Profile,
  LogEntryType,
  BookingStatus,
  ACTIVE_BOOKING_STATUSES,
} from '@/lib/db/types';
import { getDateInTimezone, getDayOfWeek, getTimeInTimezone, isBookingWithinTimeWindow } from '@/lib/utils/validation';

// ============================================================================
// Column Selections (for query optimization)
// ============================================================================

const BOOKING_COLUMNS = `
  id, captain_id, trip_type_id, vessel_id, guest_name, guest_email,
  guest_phone, party_size, scheduled_start, scheduled_end, status,
  payment_status, total_price_cents, deposit_paid_cents, balance_due_cents,
  weather_hold_reason, original_date_if_rescheduled, internal_notes,
  special_requests, captain_instructions, guest_count_confirmed,
  internal_notes, tags,
  created_at, updated_at
` as const;

const VESSEL_COLUMNS = `id, name, capacity` as const;

const TRIP_TYPE_COLUMNS = `id, title, duration_hours, price_total, deposit_amount` as const;

// ============================================================================
// Data Transformation Helpers
// ============================================================================

interface RawBookingData {
  id: string;
  captain_id: string;
  trip_type_id: string | null;
  vessel_id: string | null;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  party_size: number;
  scheduled_start: string;
  scheduled_end: string;
  status: BookingStatus;
  payment_status: string;
  total_price_cents: number;
  deposit_paid_cents: number;
  balance_due_cents: number;
  weather_hold_reason: string | null;
  original_date_if_rescheduled: string | null;
  internal_notes: string | null;
  tags: string[];
  special_requests: string | null;
  captain_instructions: string | null;
  guest_count_confirmed: number | null;
  created_at: string;
  updated_at: string;
  vessel: Array<{ id: string; name: string; capacity: number }> | { id: string; name: string; capacity: number } | null;
  trip_type: Array<{ id: string; title: string; duration_hours: number; price_total: number; deposit_amount: number }> | { id: string; title: string; duration_hours: number; price_total: number; deposit_amount: number } | null;
}

function transformBookingData(raw: RawBookingData): BookingWithDetails {
  return {
    ...raw,
    vessel: Array.isArray(raw.vessel) ? (raw.vessel[0] || null) : raw.vessel,
    trip_type: Array.isArray(raw.trip_type) ? (raw.trip_type[0] || null) : raw.trip_type,
  } as BookingWithDetails;
}

function transformBookingsData(rawList: RawBookingData[]): BookingWithDetails[] {
  return rawList.map(transformBookingData);
}

// ============================================================================
// Single Booking Queries
// ============================================================================

export async function getBookingById(id: string): Promise<BookingWithDetails | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      ${BOOKING_COLUMNS},
      vessel:vessels(${VESSEL_COLUMNS}),
      trip_type:trip_types(${TRIP_TYPE_COLUMNS})
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching booking:', error);
    }
    return null;
  }

  return transformBookingData(data as RawBookingData);
}

// ============================================================================
// Booking List Queries
// ============================================================================

export interface BookingListFilters {
  captainId: string;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus[];
  paymentStatus?: string[];
  tags?: string[];
  vesselId?: string;
  search?: string;
  includeHistorical?: boolean;
  sortField?: 'scheduled_start' | 'guest_name' | 'status' | 'created_at';
  sortDir?: 'asc' | 'desc';
  cursor?: string;
  page?: number;
  limit?: number;
}

export interface BookingListResult {
  bookings: BookingWithDetails[];
  nextCursor: string | null;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function getBookingsWithFilters(filters: BookingListFilters): Promise<BookingListResult> {
  const supabase = await createSupabaseServerClient();
  const limit = Math.min(filters.limit || 20, 100);
  const page = Math.max(filters.page || 1, 1);
  const sortField = filters.sortField || 'scheduled_start';
  const sortDir = filters.sortDir || 'asc';

  // Build base query
  let query = supabase
    .from('bookings')
    .select(`
      ${BOOKING_COLUMNS},
      vessel:vessels(${VESSEL_COLUMNS}),
      trip_type:trip_types(${TRIP_TYPE_COLUMNS})
    `, { count: 'exact' })
    .eq('captain_id', filters.captainId);

  // Apply date filters
  if (filters.startDate) {
    query = query.gte('scheduled_start', `${filters.startDate}T00:00:00Z`);
  }
  if (filters.endDate) {
    query = query.lte('scheduled_start', `${filters.endDate}T23:59:59Z`);
  }

  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  } else if (!filters.includeHistorical) {
    query = query.in('status', ACTIVE_BOOKING_STATUSES);
  }

  // Apply vessel filter
  if (filters.vesselId) {
    query = query.eq('vessel_id', filters.vesselId);
  }

  // Apply payment status filter
  if (filters.paymentStatus && filters.paymentStatus.length > 0) {
    query = query.in('payment_status', filters.paymentStatus);
  }

  // Apply tags filter (any tag match)
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  // Apply guest search (name, email, or phone)
  if (filters.search) {
    query = query.or(`guest_name.ilike.%${filters.search}%,guest_email.ilike.%${filters.search}%,guest_phone.ilike.%${filters.search}%`);
  }

  // Apply sorting
  query = query
    .order(sortField, { ascending: sortDir === 'asc' })
    .order('id', { ascending: true }); // Secondary sort for stability

  // Apply offset-based pagination using .range()
  if (filters.cursor) {
    // Legacy cursor-based pagination support
    const decodedCursor = decodeCursor(filters.cursor);
    if (decodedCursor) {
      if (sortDir === 'asc') {
        query = query.gt(sortField, decodedCursor.value);
      } else {
        query = query.lt(sortField, decodedCursor.value);
      }
    }
    query = query.limit(limit + 1);
  } else {
    // Offset-based pagination with .range()
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching bookings:', error);
    return { bookings: [], nextCursor: null, totalCount: 0, page, pageSize: limit, totalPages: 0 };
  }

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / limit);

  if (filters.cursor) {
    // Legacy cursor path
    const bookings = transformBookingsData((data || []) as RawBookingData[]);
    let nextCursor: string | null = null;
    if (bookings.length > limit) {
      const lastItem = bookings[limit - 1];
      nextCursor = encodeCursor(sortField, lastItem[sortField as keyof Booking] as string);
      bookings.pop();
    }
    return {
      bookings: bookings.slice(0, limit),
      nextCursor,
      totalCount,
      page,
      pageSize: limit,
      totalPages,
    };
  }

  const bookings = transformBookingsData((data || []) as RawBookingData[]);

  return {
    bookings,
    nextCursor: null,
    totalCount,
    page,
    pageSize: limit,
    totalPages,
  };
}

// ============================================================================
// Availability Checking
// ============================================================================

export interface VesselAvailabilityParams {
  vesselId: string;
  scheduledStart: string;
  scheduledEnd: string;
  excludeBookingId?: string;
}

export interface VesselAvailabilityResult {
  available: boolean;
  conflicts: Booking[];
}

export async function checkVesselAvailability(
  params: VesselAvailabilityParams
): Promise<VesselAvailabilityResult> {
  const supabase = await createSupabaseServerClient();

  // Find overlapping bookings for the same vessel
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('vessel_id', params.vesselId)
    .in('status', ACTIVE_BOOKING_STATUSES)
    .lt('scheduled_start', params.scheduledEnd)
    .gt('scheduled_end', params.scheduledStart);

  if (params.excludeBookingId) {
    query = query.neq('id', params.excludeBookingId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error checking vessel availability:', error);
    return { available: false, conflicts: [] };
  }

  return {
    available: (data || []).length === 0,
    conflicts: data || [],
  };
}

export interface CaptainAvailabilityParams {
  captainId: string;
  scheduledStart: string;
  scheduledEnd: string;
}

export interface CaptainAvailabilityResult {
  available: boolean;
  reason?: string;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime12h(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return minutes === 0
    ? `${displayHours} ${period}`
    : `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

function describeTimeDifference(earlier: string, later: string): string {
  const [h1, m1] = earlier.split(':').map(Number);
  const [h2, m2] = later.split(':').map(Number);
  let diffMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diffMinutes < 0) diffMinutes += 24 * 60;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export async function checkCaptainAvailability(
  params: CaptainAvailabilityParams
): Promise<CaptainAvailabilityResult> {
  const supabase = await createSupabaseServerClient();

  // Get captain's profile for timezone
  const profile = await getCaptainProfile(params.captainId);
  if (!profile) {
    return { available: false, reason: 'Captain profile not found' };
  }

  const timezone = profile.timezone || 'UTC';
  const dayOfWeek = getDayOfWeek(params.scheduledStart, timezone);

  // Get all availability windows for this day (active and inactive)
  const { data: windows, error } = await supabase
    .from('availability_windows')
    .select('*')
    .eq('owner_id', params.captainId)
    .eq('day_of_week', dayOfWeek);

  if (error) {
    console.error('Error checking captain availability:', error);
    return { available: false, reason: 'Unable to check availability' };
  }

  // If no windows defined at all, assume always available (no restrictions configured)
  if (!windows || windows.length === 0) {
    return { available: true };
  }

  const activeWindows = windows.filter((w: AvailabilityWindow) => w.is_active);

  // If window exists but is inactive, the day is OFF
  if (activeWindows.length === 0) {
    const dayName = DAY_NAMES[dayOfWeek];
    return {
      available: false,
      reason: `Not available on ${dayName}s`,
    };
  }

  // Check if the booking fits within any active availability window
  for (const window of activeWindows) {
    if (
      isBookingWithinTimeWindow(
        params.scheduledStart,
        params.scheduledEnd,
        window.start_time,
        window.end_time,
        timezone
      )
    ) {
      return { available: true };
    }
  }

  // Build a descriptive error message showing the available hours
  const window = activeWindows[0];
  const dayName = DAY_NAMES[dayOfWeek];
  const windowStartFmt = formatTime12h(window.start_time);
  const windowEndFmt = formatTime12h(window.end_time);

  const bookingStartTime = getTimeInTimezone(params.scheduledStart, timezone);
  const bookingEndTime = getTimeInTimezone(params.scheduledEnd, timezone);

  // Normalize window times for comparison
  const normalizedWindowStart = window.start_time.length === 5 ? `${window.start_time}:00` : window.start_time;
  const normalizedWindowEnd = window.end_time.length === 5 ? `${window.end_time}:00` : window.end_time;

  let detail: string;
  if (bookingStartTime < normalizedWindowStart) {
    detail = `Your booking starts at ${formatTime12h(bookingStartTime)} (${describeTimeDifference(bookingStartTime, normalizedWindowStart)} too early)`;
  } else if (bookingStartTime > normalizedWindowEnd) {
    detail = `Your booking starts at ${formatTime12h(bookingStartTime)} (${describeTimeDifference(normalizedWindowEnd, bookingStartTime)} too late)`;
  } else if (bookingEndTime > normalizedWindowEnd) {
    detail = `Your booking ends at ${formatTime12h(bookingEndTime)} (${describeTimeDifference(normalizedWindowEnd, bookingEndTime)} past closing)`;
  } else {
    detail = `Your booking (${formatTime12h(bookingStartTime)} – ${formatTime12h(bookingEndTime)}) doesn't fit this window`;
  }

  return {
    available: false,
    reason: `${dayName} bookings are available ${windowStartFmt} – ${windowEndFmt}. ${detail}`,
  };
}

export async function isBlackoutDate(captainId: string, date: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('blackout_dates')
    .select('id')
    .eq('owner_id', captainId)
    .eq('blackout_date', date)
    .limit(1);

  if (error) {
    console.error('Error checking blackout date:', error);
    return false;
  }

  return (data || []).length > 0;
}

// ============================================================================
// Profile Queries
// ============================================================================

export async function getCaptainProfile(captainId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', captainId)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Error fetching captain profile:', error);
    }
    return null;
  }

  return data as Profile;
}

// ============================================================================
// Booking Logs (Captain's Logbook)
// ============================================================================

export interface LogBookingChangeParams {
  bookingId: string;
  entryType: LogEntryType;
  description: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  actorType?: 'captain' | 'guest' | 'system';
  actorId?: string;
}

export async function logBookingChange(params: LogBookingChangeParams): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('booking_logs').insert({
    booking_id: params.bookingId,
    entry_type: params.entryType,
    description: params.description,
    old_value: params.oldValue || null,
    new_value: params.newValue || null,
    actor_type: params.actorType || 'system',
    actor_id: params.actorId || null,
  });

  if (error) {
    console.error('Error logging booking change:', error);
  }
}

export async function getBookingLogs(bookingId: string): Promise<BookingLog[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('booking_logs')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching booking logs:', error);
    return [];
  }

  return data as BookingLog[];
}

// ============================================================================
// Export Queries (no pagination)
// ============================================================================

export async function getBookingsForExport(
  filters: Omit<BookingListFilters, 'cursor' | 'limit'>
): Promise<BookingWithDetails[]> {
  const supabase = await createSupabaseServerClient();
  const sortField = filters.sortField || 'scheduled_start';
  const sortDir = filters.sortDir || 'asc';

  let query = supabase
    .from('bookings')
    .select(`
      ${BOOKING_COLUMNS},
      vessel:vessels(${VESSEL_COLUMNS}),
      trip_type:trip_types(${TRIP_TYPE_COLUMNS})
    `)
    .eq('captain_id', filters.captainId);

  if (filters.startDate) {
    query = query.gte('scheduled_start', `${filters.startDate}T00:00:00Z`);
  }
  if (filters.endDate) {
    query = query.lte('scheduled_start', `${filters.endDate}T23:59:59Z`);
  }
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  } else if (!filters.includeHistorical) {
    query = query.in('status', ACTIVE_BOOKING_STATUSES);
  }
  if (filters.vesselId) {
    query = query.eq('vessel_id', filters.vesselId);
  }
  if (filters.paymentStatus && filters.paymentStatus.length > 0) {
    query = query.in('payment_status', filters.paymentStatus);
  }
  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }
  if (filters.search) {
    query = query.or(`guest_name.ilike.%${filters.search}%,guest_email.ilike.%${filters.search}%,guest_phone.ilike.%${filters.search}%`);
  }

  query = query.order(sortField, { ascending: sortDir === 'asc' });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching bookings for export:', error);
    return [];
  }

  return transformBookingsData((data || []) as RawBookingData[]);
}

// ============================================================================
// Guest Token Queries
// ============================================================================

export async function getBookingByToken(token: string): Promise<BookingWithDetails | null> {
  const supabase = await createSupabaseServerClient();

  // First find the valid token
  const { data: tokenData, error: tokenError } = await supabase
    .from('guest_tokens')
    .select('booking_id, expires_at')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    return null;
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return null;
  }

  // Get the booking
  return getBookingById(tokenData.booking_id);
}

// ============================================================================
// Reschedule Offers
// ============================================================================

export async function getRescheduleOffers(bookingId: string) {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('reschedule_offers')
    .select('*')
    .eq('booking_id', bookingId)
    .order('proposed_start', { ascending: true });

  if (error) {
    console.error('Error fetching reschedule offers:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// Cursor Utilities
// ============================================================================

function encodeCursor(field: string, value: string): string {
  return Buffer.from(JSON.stringify({ field, value })).toString('base64');
}

function decodeCursor(cursor: string): { field: string; value: string } | null {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}
