'use server';

import { createSupabaseServiceClient } from '@/utils/supabase/service';
import {
  Profile,
  TripType,
  AvailabilityWindow,
  BlackoutDate,
  Booking,
  MAX_PARTY_SIZE
} from '@/lib/db/types';
import {
  isValidUUID,
  isValidEmail,
  isValidPhone,
  isValidDate,
  isValidPartySize,
  sanitizeName,
  sanitizeNotes,
  createTimestamp,
  parseTime,
} from '@/lib/utils/validation';
import { addHours, format, parseISO, isValid, startOfDay, endOfDay, isBefore, addDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// ============================================================================
// Types
// ============================================================================

export type ErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAVAILABLE'
  | 'CAPACITY'
  | 'DATABASE'
  | 'HIBERNATING';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ErrorCode;
}

export interface PublicCaptainProfile {
  id: string;
  business_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  meeting_spot_name: string | null;
  meeting_spot_address: string | null;
  meeting_spot_instructions: string | null;
  cancellation_policy: string | null;
  is_hibernating: boolean;
  hibernation_message: string | null;
  advance_booking_days: number;
}

export interface HibernationInfo {
  id: string;
  business_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  timezone: string;
  hibernation_message: string | null;
  hibernation_end_date: string | null;
  hibernation_show_return_date: boolean;
  hibernation_allow_notifications: boolean;
  hibernation_show_contact_info: boolean;
}

export interface PublicTripType {
  id: string;
  title: string;
  duration_hours: number;
  price_total: number;
  deposit_amount: number;
  description: string | null;
  vessel?: {
    id: string;
    name: string;
  } | null;
}

export interface TimeSlot {
  start_time: string; // HH:MM format
  end_time: string;   // HH:MM format
  available: boolean;
}

export interface AvailabilityResult {
  date: string;
  day_of_week: number;
  is_blackout: boolean;
  blackout_reason?: string | null;
  time_slots: TimeSlot[];
}

export interface PassengerInput {
  full_name: string;
  email?: string | null;
  phone?: string | null;
}

export interface CreatePublicBookingParams {
  captain_id: string;
  trip_type_id: string;
  scheduled_date: string;    // YYYY-MM-DD
  scheduled_time: string;    // HH:MM
  guest_name: string;
  guest_email: string;
  guest_phone?: string | null;
  party_size: number;
  passengers?: PassengerInput[];
  special_requests?: string | null;
}

export interface PublicBookingResult {
  booking_id: string;
  confirmation_code: string;
  guest_token: string;
  scheduled_start: string;
  scheduled_end: string;
  total_price_cents: number;
  deposit_amount_cents: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars (0,O,I,1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateGuestToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================================================
// Public Server Actions
// ============================================================================

/**
 * Get captain profile for public display (no auth required)
 */
export async function getPublicCaptainProfile(
  captainId: string
): Promise<ActionResult<PublicCaptainProfile>> {
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      business_name,
      full_name,
      avatar_url,
      timezone,
      meeting_spot_name,
      meeting_spot_address,
      meeting_spot_instructions,
      cancellation_policy,
      is_hibernating,
      hibernation_message,
      advance_booking_days
    `)
    .eq('id', captainId)
    .single();

  if (error || !data) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  if (data.is_hibernating) {
    return {
      success: false,
      error: data.hibernation_message || 'This captain is not currently accepting bookings',
      code: 'HIBERNATING'
    };
  }

  return { success: true, data: data as PublicCaptainProfile };
}

/**
 * Get hibernation info for displaying the hibernation page (no auth required)
 */
export async function getHibernationInfo(
  captainId: string
): Promise<ActionResult<HibernationInfo>> {
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      business_name,
      full_name,
      email,
      phone,
      timezone,
      is_hibernating,
      hibernation_message,
      hibernation_end_date,
      hibernation_show_return_date,
      hibernation_allow_notifications,
      hibernation_show_contact_info
    `)
    .eq('id', captainId)
    .single();

  if (error || !data) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  // Only return if hibernating
  if (!data.is_hibernating) {
    return { success: false, error: 'Captain is accepting bookings', code: 'VALIDATION' };
  }

  // Filter contact info based on settings
  const result: HibernationInfo = {
    id: data.id,
    business_name: data.business_name,
    full_name: data.full_name,
    email: data.hibernation_show_contact_info ? data.email : null,
    phone: data.hibernation_show_contact_info ? data.phone : null,
    timezone: data.timezone,
    hibernation_message: data.hibernation_message,
    hibernation_end_date: data.hibernation_show_return_date ? data.hibernation_end_date : null,
    hibernation_show_return_date: data.hibernation_show_return_date ?? false,
    hibernation_allow_notifications: data.hibernation_allow_notifications ?? false,
    hibernation_show_contact_info: data.hibernation_show_contact_info ?? false,
  };

  return { success: true, data: result };
}

/**
 * Get active trip types for a captain (no auth required)
 */
export async function getPublicTripTypes(
  captainId: string
): Promise<ActionResult<PublicTripType[]>> {
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  const supabase = createSupabaseServiceClient();

  // First check if captain exists and is not hibernating
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, is_hibernating, hibernation_message')
    .eq('id', captainId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  if (profile.is_hibernating) {
    return {
      success: false,
      error: 'This captain is not currently accepting bookings',
      code: 'HIBERNATING'
    };
  }

  // Get active trip types
  const { data: tripTypes, error: tripError } = await supabase
    .from('trip_types')
    .select(`
      id,
      title,
      duration_hours,
      price_total,
      deposit_amount,
      description
    `)
    .eq('owner_id', captainId)
    .order('price_total', { ascending: true });

  if (tripError) {
    return { success: false, error: 'Failed to fetch trip types', code: 'DATABASE' };
  }

  return { success: true, data: tripTypes || [] };
}

/**
 * Get a single trip type by ID (no auth required)
 */
export async function getPublicTripType(
  captainId: string,
  tripTypeId: string
): Promise<ActionResult<PublicTripType>> {
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }
  if (!tripTypeId || !isValidUUID(tripTypeId)) {
    return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
  }

  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('trip_types')
    .select(`
      id,
      title,
      duration_hours,
      price_total,
      deposit_amount,
      description
    `)
    .eq('id', tripTypeId)
    .eq('owner_id', captainId)
    .single();

  if (error || !data) {
    return { success: false, error: 'Trip type not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: data as PublicTripType };
}

/**
 * Get availability for a specific date (no auth required)
 */
export async function getAvailability(
  captainId: string,
  tripTypeId: string,
  date: string
): Promise<ActionResult<AvailabilityResult>> {
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }
  if (!tripTypeId || !isValidUUID(tripTypeId)) {
    return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
  }
  if (!isValidDate(date)) {
    return { success: false, error: 'Invalid date format', code: 'VALIDATION' };
  }

  const supabase = createSupabaseServiceClient();

  // Get captain profile for timezone and booking settings
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('timezone, booking_buffer_minutes, advance_booking_days, is_hibernating')
    .eq('id', captainId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  if (profile.is_hibernating) {
    return { success: false, error: 'Captain is not accepting bookings', code: 'HIBERNATING' };
  }

  // Get trip type for duration
  const { data: tripType, error: tripError } = await supabase
    .from('trip_types')
    .select('duration_hours')
    .eq('id', tripTypeId)
    .eq('owner_id', captainId)
    .single();

  if (tripError || !tripType) {
    return { success: false, error: 'Trip type not found', code: 'NOT_FOUND' };
  }

  const timezone = profile.timezone || 'America/New_York';
  const requestedDate = parseISO(date);

  if (!isValid(requestedDate)) {
    return { success: false, error: 'Invalid date', code: 'VALIDATION' };
  }

  // Check if date is too far in advance
  const maxAdvanceDate = addDays(new Date(), profile.advance_booking_days || 60);
  if (isBefore(maxAdvanceDate, requestedDate)) {
    return {
      success: false,
      error: `Bookings can only be made up to ${profile.advance_booking_days || 60} days in advance`,
      code: 'UNAVAILABLE'
    };
  }

  // Check if date is in the past
  const today = startOfDay(new Date());
  if (isBefore(requestedDate, today)) {
    return { success: false, error: 'Cannot book dates in the past', code: 'UNAVAILABLE' };
  }

  // Get day of week (0 = Sunday, 6 = Saturday)
  const dayOfWeek = requestedDate.getDay();

  // Check for blackout dates
  const { data: blackouts } = await supabase
    .from('blackout_dates')
    .select('blackout_date, reason')
    .eq('owner_id', captainId)
    .eq('blackout_date', date);

  if (blackouts && blackouts.length > 0) {
    return {
      success: true,
      data: {
        date,
        day_of_week: dayOfWeek,
        is_blackout: true,
        blackout_reason: blackouts[0].reason,
        time_slots: [],
      },
    };
  }

  // Get availability windows for this day of week
  const { data: windows, error: windowError } = await supabase
    .from('availability_windows')
    .select('start_time, end_time')
    .eq('owner_id', captainId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_active', true);

  if (windowError) {
    return { success: false, error: 'Failed to fetch availability', code: 'DATABASE' };
  }

  if (!windows || windows.length === 0) {
    return {
      success: true,
      data: {
        date,
        day_of_week: dayOfWeek,
        is_blackout: false,
        time_slots: [],
      },
    };
  }

  // Get existing bookings for this date
  const dateStart = `${date}T00:00:00`;
  const dateEnd = `${date}T23:59:59`;

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('scheduled_start, scheduled_end')
    .eq('captain_id', captainId)
    .gte('scheduled_start', dateStart)
    .lte('scheduled_start', dateEnd)
    .in('status', ['pending_deposit', 'confirmed', 'weather_hold', 'rescheduled']);

  // Generate time slots from availability windows
  const timeSlots: TimeSlot[] = [];
  const tripDurationHours = tripType.duration_hours;

  for (const window of windows) {
    const startParsed = parseTime(window.start_time);
    const endParsed = parseTime(window.end_time);

    if (!startParsed || !endParsed) continue;

    // Generate slots at 30-minute intervals
    let currentHour = startParsed.hours;
    let currentMinute = startParsed.minutes;

    while (true) {
      const slotStartTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Calculate end time based on trip duration
      const endHour = currentHour + tripDurationHours;
      const slotEndTime = `${String(endHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

      // Check if slot ends within the availability window
      if (endHour > endParsed.hours || (endHour === endParsed.hours && currentMinute > endParsed.minutes)) {
        break;
      }

      // Check if slot conflicts with existing bookings
      const slotStartTs = createTimestamp(date, slotStartTime, timezone);
      const slotEndTs = createTimestamp(date, slotEndTime, timezone);

      let isAvailable = true;

      if (slotStartTs && slotEndTs && existingBookings) {
        for (const booking of existingBookings) {
          const bookingStart = new Date(booking.scheduled_start).getTime();
          const bookingEnd = new Date(booking.scheduled_end).getTime();
          const slotStart = new Date(slotStartTs).getTime();
          const slotEnd = new Date(slotEndTs).getTime();

          // Check for overlap
          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            isAvailable = false;
            break;
          }
        }
      }

      // Check if slot is too soon (within buffer time)
      if (slotStartTs) {
        const bufferMs = (profile.booking_buffer_minutes || 60) * 60 * 1000;
        const now = Date.now();
        const slotTime = new Date(slotStartTs).getTime();

        if (slotTime < now + bufferMs) {
          isAvailable = false;
        }
      }

      timeSlots.push({
        start_time: slotStartTime,
        end_time: slotEndTime,
        available: isAvailable,
      });

      // Move to next slot (30-minute intervals)
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }

      // Safety check to prevent infinite loop
      if (currentHour > 23) break;
    }
  }

  return {
    success: true,
    data: {
      date,
      day_of_week: dayOfWeek,
      is_blackout: false,
      time_slots: timeSlots,
    },
  };
}

/**
 * Get available dates for the next N days (no auth required)
 */
export async function getAvailableDates(
  captainId: string,
  days: number = 60
): Promise<ActionResult<{ date: string; has_availability: boolean }[]>> {
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  const supabase = createSupabaseServiceClient();

  // Get captain profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('advance_booking_days, is_hibernating')
    .eq('id', captainId)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  if (profile.is_hibernating) {
    return { success: false, error: 'Captain is not accepting bookings', code: 'HIBERNATING' };
  }

  const maxDays = Math.min(days, profile.advance_booking_days || 60);

  // Get all availability windows
  const { data: windows } = await supabase
    .from('availability_windows')
    .select('day_of_week')
    .eq('owner_id', captainId)
    .eq('is_active', true);

  const availableDaysOfWeek = new Set((windows || []).map((w: { day_of_week: number }) => w.day_of_week));

  // Get all blackout dates in range
  const startDate = format(new Date(), 'yyyy-MM-dd');
  const endDate = format(addDays(new Date(), maxDays), 'yyyy-MM-dd');

  const { data: blackouts } = await supabase
    .from('blackout_dates')
    .select('blackout_date')
    .eq('owner_id', captainId)
    .gte('blackout_date', startDate)
    .lte('blackout_date', endDate);

  const blackoutSet = new Set((blackouts || []).map((b: { blackout_date: string }) => b.blackout_date));

  // Generate list of dates
  const dates: { date: string; has_availability: boolean }[] = [];
  const today = new Date();

  for (let i = 0; i <= maxDays; i++) {
    const currentDate = addDays(today, i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayOfWeek = currentDate.getDay();

    const hasAvailability =
      availableDaysOfWeek.has(dayOfWeek) &&
      !blackoutSet.has(dateStr);

    dates.push({
      date: dateStr,
      has_availability: hasAvailability,
    });
  }

  return { success: true, data: dates };
}

/**
 * Create a booking from the public booking form (no auth required)
 */
export async function createPublicBooking(
  params: CreatePublicBookingParams
): Promise<ActionResult<PublicBookingResult>> {
  // Validate inputs
  if (!params.captain_id || !isValidUUID(params.captain_id)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }
  if (!params.trip_type_id || !isValidUUID(params.trip_type_id)) {
    return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
  }
  if (!isValidDate(params.scheduled_date)) {
    return { success: false, error: 'Invalid date format', code: 'VALIDATION' };
  }
  if (!params.guest_name || sanitizeName(params.guest_name).length === 0) {
    return { success: false, error: 'Guest name is required', code: 'VALIDATION' };
  }
  if (!isValidEmail(params.guest_email)) {
    return { success: false, error: 'Valid email is required', code: 'VALIDATION' };
  }
  if (params.guest_phone && !isValidPhone(params.guest_phone)) {
    return { success: false, error: 'Invalid phone number format', code: 'VALIDATION' };
  }
  if (!isValidPartySize(params.party_size, MAX_PARTY_SIZE)) {
    return {
      success: false,
      error: `Party size must be between 1 and ${MAX_PARTY_SIZE}`,
      code: 'CAPACITY'
    };
  }

  const supabase = createSupabaseServiceClient();

  // Get captain profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('timezone, is_hibernating, advance_booking_days')
    .eq('id', params.captain_id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  if (profile.is_hibernating) {
    return { success: false, error: 'Captain is not accepting bookings', code: 'HIBERNATING' };
  }

  // Get trip type
  const { data: tripType, error: tripError } = await supabase
    .from('trip_types')
    .select('id, duration_hours, price_total, deposit_amount')
    .eq('id', params.trip_type_id)
    .eq('owner_id', params.captain_id)
    .single();

  if (tripError || !tripType) {
    return { success: false, error: 'Trip type not found', code: 'NOT_FOUND' };
  }

  const timezone = profile.timezone || 'America/New_York';

  // Create timestamps
  const scheduledStart = createTimestamp(
    params.scheduled_date,
    params.scheduled_time,
    timezone
  );

  if (!scheduledStart) {
    return { success: false, error: 'Invalid date/time', code: 'VALIDATION' };
  }

  const scheduledEnd = addHours(new Date(scheduledStart), tripType.duration_hours).toISOString();

  // Verify availability one more time
  const availabilityCheck = await getAvailability(
    params.captain_id,
    params.trip_type_id,
    params.scheduled_date
  );

  if (!availabilityCheck.success) {
    return { success: false, error: availabilityCheck.error, code: availabilityCheck.code };
  }

  const requestedSlot = availabilityCheck.data?.time_slots.find(
    slot => slot.start_time === params.scheduled_time && slot.available
  );

  if (!requestedSlot) {
    return {
      success: false,
      error: 'Selected time slot is no longer available',
      code: 'UNAVAILABLE'
    };
  }

  // Generate codes
  const confirmationCode = generateConfirmationCode();
  const guestToken = generateGuestToken();

  // Calculate prices in cents
  const totalPriceCents = Math.round(tripType.price_total * 100);
  const depositAmountCents = Math.round(tripType.deposit_amount * 100);

  // Create booking
  const { data: newBooking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      captain_id: params.captain_id,
      trip_type_id: params.trip_type_id,
      guest_name: sanitizeName(params.guest_name),
      guest_email: params.guest_email.trim().toLowerCase(),
      guest_phone: params.guest_phone?.trim() || null,
      party_size: params.party_size,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      status: 'pending_deposit',
      payment_status: 'unpaid',
      total_price_cents: totalPriceCents,
      deposit_paid_cents: 0,
      balance_due_cents: totalPriceCents,
      special_requests: sanitizeNotes(params.special_requests),
    })
    .select('id')
    .single();

  if (insertError || !newBooking) {
    console.error('Failed to create booking:', insertError);
    return { success: false, error: 'Failed to create booking', code: 'DATABASE' };
  }

  // Create guest token
  const tokenExpiry = addDays(new Date(scheduledStart), 7).toISOString();

  const { error: tokenError } = await supabase
    .from('guest_tokens')
    .insert({
      booking_id: newBooking.id,
      token: guestToken,
      expires_at: tokenExpiry,
    });

  if (tokenError) {
    console.error('Failed to create guest token:', tokenError);
    // Don't fail the booking, just log the error
  }

  // Add primary contact as passenger
  const { error: passengerError } = await supabase
    .from('passengers')
    .insert({
      booking_id: newBooking.id,
      full_name: sanitizeName(params.guest_name),
      email: params.guest_email.trim().toLowerCase(),
      phone: params.guest_phone?.trim() || null,
      is_primary_contact: true,
    });

  if (passengerError) {
    console.error('Failed to add primary passenger:', passengerError);
  }

  // Add additional passengers
  if (params.passengers && params.passengers.length > 0) {
    const additionalPassengers = params.passengers
      .filter(p => p.full_name && sanitizeName(p.full_name).length > 0)
      .map(p => ({
        booking_id: newBooking.id,
        full_name: sanitizeName(p.full_name),
        email: p.email?.trim().toLowerCase() || null,
        phone: p.phone?.trim() || null,
        is_primary_contact: false,
      }));

    if (additionalPassengers.length > 0) {
      const { error: addPassengerError } = await supabase
        .from('passengers')
        .insert(additionalPassengers);

      if (addPassengerError) {
        console.error('Failed to add additional passengers:', addPassengerError);
      }
    }
  }

  // Log booking creation
  await supabase
    .from('booking_logs')
    .insert({
      booking_id: newBooking.id,
      entry_type: 'booking_created',
      description: 'Booking created via public booking form',
      actor_type: 'guest',
      actor_id: null,
    });

  return {
    success: true,
    data: {
      booking_id: newBooking.id,
      confirmation_code: confirmationCode,
      guest_token: guestToken,
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      total_price_cents: totalPriceCents,
      deposit_amount_cents: depositAmountCents,
    },
  };
}
