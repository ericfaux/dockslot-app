'use server';

/**
 * DockSlot Booking Server Actions
 * Handles all booking CRUD operations and state transitions
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  Booking,
  BookingWithDetails,
  BookingStatus,
  RescheduleOffer,
  isValidTransition,
  MAX_PARTY_SIZE,
} from '@/lib/db/types';
import {
  getBookingById,
  checkVesselAvailability,
  checkCaptainAvailability,
  getCaptainProfile,
  isBlackoutDate,
  logBookingChange,
  getBookingByToken,
} from '@/lib/data/bookings';
import {
  isValidEmail,
  isValidPhone,
  isValidTimestamp,
  isFutureTimestamp,
  isValidUUID,
  isValidPartySize,
  sanitizeName,
  sanitizeNotes,
  getDateInTimezone,
} from '@/lib/utils/validation';
import { differenceInDays, parseISO } from 'date-fns';

// ============================================================================
// Types
// ============================================================================

export type BookingErrorCode =
  | 'CONFLICT'
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'CAPACITY'
  | 'INVALID_TRANSITION'
  | 'BLACKOUT'
  | 'OUTSIDE_HOURS'
  | 'HIBERNATING'
  | 'UNKNOWN';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: BookingErrorCode;
}

export interface CreateBookingParams {
  captain_id: string;
  vessel_id?: string;
  trip_type_id?: string;
  scheduled_start: string;
  scheduled_end: string;
  party_size: number;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  special_requests?: string;
  internal_notes?: string;
}

export interface UpdateBookingParams {
  vessel_id?: string;
  trip_type_id?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  party_size?: number;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  special_requests?: string;
  internal_notes?: string;
  captain_instructions?: string;
  guest_count_confirmed?: number;
}

// ============================================================================
// Confirmation Code Generation
// ============================================================================

function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes confusing chars (0,O,I,1)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============================================================================
// Rate Limiting (for guest lookups)
// ============================================================================

const lookupAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_LOOKUP_ATTEMPTS = 5;
const LOOKUP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = lookupAttempts.get(ip);

  if (!record || now > record.resetAt) {
    lookupAttempts.set(ip, { count: 1, resetAt: now + LOOKUP_WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_LOOKUP_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

// ============================================================================
// Create Booking
// ============================================================================

export async function createBooking(
  params: CreateBookingParams
): Promise<ActionResult<BookingWithDetails>> {
  // Validate required fields
  if (!params.captain_id || !isValidUUID(params.captain_id)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  if (!params.scheduled_start || !isValidTimestamp(params.scheduled_start)) {
    return { success: false, error: 'Invalid start time', code: 'VALIDATION' };
  }

  if (!params.scheduled_end || !isValidTimestamp(params.scheduled_end)) {
    return { success: false, error: 'Invalid end time', code: 'VALIDATION' };
  }

  if (!isFutureTimestamp(params.scheduled_start)) {
    return { success: false, error: 'Booking must be in the future', code: 'VALIDATION' };
  }

  if (params.scheduled_end <= params.scheduled_start) {
    return { success: false, error: 'End time must be after start time', code: 'VALIDATION' };
  }

  if (!params.guest_name || sanitizeName(params.guest_name).length === 0) {
    return { success: false, error: 'Guest name is required', code: 'VALIDATION' };
  }

  if (!params.guest_email || !isValidEmail(params.guest_email)) {
    return { success: false, error: 'Valid email is required', code: 'VALIDATION' };
  }

  if (params.guest_phone && !isValidPhone(params.guest_phone)) {
    return { success: false, error: 'Invalid phone number format', code: 'VALIDATION' };
  }

  // Validate party size
  if (!isValidPartySize(params.party_size, MAX_PARTY_SIZE)) {
    return {
      success: false,
      error: `Party size cannot exceed ${MAX_PARTY_SIZE} passengers (USCG 6-pack license limit)`,
      code: 'CAPACITY',
    };
  }

  // Get captain profile
  const profile = await getCaptainProfile(params.captain_id);
  if (!profile) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  // Check hibernation mode
  if (profile.is_hibernating) {
    return {
      success: false,
      error: profile.hibernation_message || 'Bookings are currently closed for the season',
      code: 'HIBERNATING',
    };
  }

  // Check advance booking limit
  const daysUntilBooking = differenceInDays(parseISO(params.scheduled_start), new Date());
  if (daysUntilBooking > profile.advance_booking_days) {
    return {
      success: false,
      error: `Bookings can only be made up to ${profile.advance_booking_days} days in advance`,
      code: 'VALIDATION',
    };
  }

  // Check blackout dates
  const timezone = profile.timezone || 'UTC';
  const bookingDate = getDateInTimezone(params.scheduled_start, timezone);
  const isBlackedOut = await isBlackoutDate(params.captain_id, bookingDate);
  if (isBlackedOut) {
    return {
      success: false,
      error: 'This date is unavailable for bookings',
      code: 'BLACKOUT',
    };
  }

  // Check captain availability windows
  const captainAvailability = await checkCaptainAvailability({
    captainId: params.captain_id,
    scheduledStart: params.scheduled_start,
    scheduledEnd: params.scheduled_end,
  });
  if (!captainAvailability.available) {
    return {
      success: false,
      error: captainAvailability.reason || 'This time slot is outside available booking hours',
      code: 'OUTSIDE_HOURS',
    };
  }

  // Check vessel availability if specified
  if (params.vessel_id) {
    if (!isValidUUID(params.vessel_id)) {
      return { success: false, error: 'Invalid vessel ID', code: 'VALIDATION' };
    }

    // Verify vessel belongs to captain and check capacity
    const supabase = await createSupabaseServerClient();
    const { data: vessel } = await supabase
      .from('vessels')
      .select('id, capacity, owner_id')
      .eq('id', params.vessel_id)
      .single();

    if (!vessel || vessel.owner_id !== params.captain_id) {
      return { success: false, error: 'Vessel not found', code: 'NOT_FOUND' };
    }

    if (vessel.capacity && params.party_size > vessel.capacity) {
      return {
        success: false,
        error: `This vessel can accommodate up to ${vessel.capacity} passengers`,
        code: 'CAPACITY',
      };
    }

    const vesselAvailability = await checkVesselAvailability({
      vesselId: params.vessel_id,
      scheduledStart: params.scheduled_start,
      scheduledEnd: params.scheduled_end,
    });
    if (!vesselAvailability.available) {
      return {
        success: false,
        error: 'This vessel is not available for the selected time',
        code: 'CONFLICT',
      };
    }
  }

  // Validate trip type if specified
  let totalPriceCents = 0;
  let depositAmountCents = 0;

  if (params.trip_type_id) {
    if (!isValidUUID(params.trip_type_id)) {
      return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
    }

    const supabase = await createSupabaseServerClient();
    const { data: tripType } = await supabase
      .from('trip_types')
      .select('id, price_total, deposit_amount, owner_id')
      .eq('id', params.trip_type_id)
      .single();

    if (!tripType || tripType.owner_id !== params.captain_id) {
      return { success: false, error: 'Trip type not found', code: 'NOT_FOUND' };
    }

    totalPriceCents = Math.round(tripType.price_total * 100);
    depositAmountCents = Math.round(tripType.deposit_amount * 100);
  }

  // Create the booking
  const supabase = await createSupabaseServerClient();

  const { data: newBooking, error: insertError } = await supabase
    .from('bookings')
    .insert({
      captain_id: params.captain_id,
      vessel_id: params.vessel_id || null,
      trip_type_id: params.trip_type_id || null,
      scheduled_start: params.scheduled_start,
      scheduled_end: params.scheduled_end,
      party_size: params.party_size,
      guest_name: sanitizeName(params.guest_name),
      guest_email: params.guest_email.trim().toLowerCase(),
      guest_phone: params.guest_phone || null,
      special_requests: sanitizeNotes(params.special_requests) || null,
      internal_notes: sanitizeNotes(params.internal_notes) || null,
      status: 'pending_deposit',
      payment_status: 'unpaid',
      total_price_cents: totalPriceCents,
      balance_due_cents: totalPriceCents,
      deposit_paid_cents: 0,
    })
    .select('id')
    .single();

  if (insertError || !newBooking) {
    console.error('Error creating booking:', insertError);
    return { success: false, error: 'Failed to create booking', code: 'UNKNOWN' };
  }

  // Log the booking creation
  await logBookingChange({
    bookingId: newBooking.id,
    entryType: 'booking_created',
    description: `Booking created for ${params.guest_name}`,
    newValue: {
      guest_name: params.guest_name,
      scheduled_start: params.scheduled_start,
      party_size: params.party_size,
    },
    actorType: 'system',
  });

  // Create guest token for self-service
  const confirmationCode = generateConfirmationCode();
  await supabase.from('guest_tokens').insert({
    booking_id: newBooking.id,
    token: confirmationCode,
  });

  // Fetch the complete booking with details
  const booking = await getBookingById(newBooking.id);
  if (!booking) {
    return { success: false, error: 'Booking created but failed to retrieve', code: 'UNKNOWN' };
  }

  return { success: true, data: booking };
}

// ============================================================================
// Update Booking
// ============================================================================

export async function updateBooking(
  bookingId: string,
  updates: UpdateBookingParams
): Promise<ActionResult<Booking>> {
  if (!bookingId || !isValidUUID(bookingId)) {
    return { success: false, error: 'Invalid booking ID', code: 'VALIDATION' };
  }

  const existing = await getBookingById(bookingId);
  if (!existing) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  // Cannot update terminal status bookings
  if (['completed', 'cancelled', 'no_show'].includes(existing.status)) {
    return { success: false, error: 'Cannot update a completed, cancelled, or no-show booking', code: 'VALIDATION' };
  }

  const updateData: Record<string, unknown> = {};

  // Validate and add each update field
  if (updates.guest_name !== undefined) {
    const name = sanitizeName(updates.guest_name);
    if (!name) {
      return { success: false, error: 'Guest name is required', code: 'VALIDATION' };
    }
    updateData.guest_name = name;
  }

  if (updates.guest_email !== undefined) {
    if (!isValidEmail(updates.guest_email)) {
      return { success: false, error: 'Valid email is required', code: 'VALIDATION' };
    }
    updateData.guest_email = updates.guest_email.trim().toLowerCase();
  }

  if (updates.guest_phone !== undefined) {
    if (updates.guest_phone && !isValidPhone(updates.guest_phone)) {
      return { success: false, error: 'Invalid phone number format', code: 'VALIDATION' };
    }
    updateData.guest_phone = updates.guest_phone || null;
  }

  if (updates.party_size !== undefined) {
    if (!isValidPartySize(updates.party_size, MAX_PARTY_SIZE)) {
      return { success: false, error: `Party size cannot exceed ${MAX_PARTY_SIZE} passengers`, code: 'CAPACITY' };
    }
    updateData.party_size = updates.party_size;
  }

  if (updates.special_requests !== undefined) {
    updateData.special_requests = sanitizeNotes(updates.special_requests) || null;
  }

  if (updates.internal_notes !== undefined) {
    updateData.internal_notes = sanitizeNotes(updates.internal_notes) || null;
  }

  if (updates.captain_instructions !== undefined) {
    updateData.captain_instructions = sanitizeNotes(updates.captain_instructions) || null;
  }

  if (updates.guest_count_confirmed !== undefined) {
    updateData.guest_count_confirmed = updates.guest_count_confirmed;
  }

  // Handle schedule changes
  if (updates.scheduled_start !== undefined || updates.scheduled_end !== undefined) {
    const newStart = updates.scheduled_start || existing.scheduled_start;
    const newEnd = updates.scheduled_end || existing.scheduled_end;

    if (!isValidTimestamp(newStart) || !isValidTimestamp(newEnd)) {
      return { success: false, error: 'Invalid date/time', code: 'VALIDATION' };
    }

    if (newEnd <= newStart) {
      return { success: false, error: 'End time must be after start time', code: 'VALIDATION' };
    }

    // Re-check availability for new times
    if (existing.vessel_id) {
      const vesselAvailability = await checkVesselAvailability({
        vesselId: existing.vessel_id,
        scheduledStart: newStart,
        scheduledEnd: newEnd,
        excludeBookingId: bookingId,
      });
      if (!vesselAvailability.available) {
        return { success: false, error: 'Vessel not available for new time', code: 'CONFLICT' };
      }
    }

    updateData.scheduled_start = newStart;
    updateData.scheduled_end = newEnd;
  }

  // Handle vessel change
  if (updates.vessel_id !== undefined) {
    if (updates.vessel_id && !isValidUUID(updates.vessel_id)) {
      return { success: false, error: 'Invalid vessel ID', code: 'VALIDATION' };
    }

    if (updates.vessel_id) {
      const supabase = await createSupabaseServerClient();
      const { data: vessel } = await supabase
        .from('vessels')
        .select('id, capacity, owner_id')
        .eq('id', updates.vessel_id)
        .single();

      if (!vessel || vessel.owner_id !== existing.captain_id) {
        return { success: false, error: 'Vessel not found', code: 'NOT_FOUND' };
      }

      const partySize = updates.party_size ?? existing.party_size;
      if (vessel.capacity && partySize > vessel.capacity) {
        return { success: false, error: `Vessel can accommodate up to ${vessel.capacity} passengers`, code: 'CAPACITY' };
      }

      const vesselAvailability = await checkVesselAvailability({
        vesselId: updates.vessel_id,
        scheduledStart: updates.scheduled_start || existing.scheduled_start,
        scheduledEnd: updates.scheduled_end || existing.scheduled_end,
        excludeBookingId: bookingId,
      });
      if (!vesselAvailability.available) {
        return { success: false, error: 'Vessel not available', code: 'CONFLICT' };
      }
    }

    updateData.vessel_id = updates.vessel_id || null;
  }

  // Handle trip type change
  if (updates.trip_type_id !== undefined) {
    if (updates.trip_type_id && !isValidUUID(updates.trip_type_id)) {
      return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
    }
    updateData.trip_type_id = updates.trip_type_id || null;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'No valid updates provided', code: 'VALIDATION' };
  }

  updateData.updated_at = new Date().toISOString();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating booking:', error);
    return { success: false, error: 'Failed to update booking', code: 'UNKNOWN' };
  }

  // Log the update
  await logBookingChange({
    bookingId,
    entryType: 'status_changed',
    description: 'Booking details updated',
    oldValue: { ...existing },
    newValue: updateData,
    actorType: 'captain',
  });

  return { success: true, data: data as Booking };
}

// ============================================================================
// Status Transitions
// ============================================================================

async function transitionBookingStatus(
  bookingId: string,
  newStatus: BookingStatus,
  additionalUpdates?: Record<string, unknown>,
  logDescription?: string
): Promise<ActionResult<Booking>> {
  if (!bookingId || !isValidUUID(bookingId)) {
    return { success: false, error: 'Invalid booking ID', code: 'VALIDATION' };
  }

  const existing = await getBookingById(bookingId);
  if (!existing) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  if (!isValidTransition(existing.status, newStatus)) {
    return {
      success: false,
      error: `Cannot transition from '${existing.status}' to '${newStatus}'`,
      code: 'INVALID_TRANSITION',
    };
  }

  const supabase = await createSupabaseServerClient();
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    ...additionalUpdates,
  };

  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error transitioning booking status:', error);
    return { success: false, error: 'Failed to update booking status', code: 'UNKNOWN' };
  }

  await logBookingChange({
    bookingId,
    entryType: 'status_changed',
    description: logDescription || `Status changed to ${newStatus}`,
    oldValue: { status: existing.status },
    newValue: { status: newStatus },
    actorType: 'captain',
  });

  return { success: true, data: data as Booking };
}

export async function cancelBooking(
  bookingId: string,
  reason?: string
): Promise<ActionResult<Booking>> {
  return transitionBookingStatus(
    bookingId,
    'cancelled',
    { internal_notes: reason },
    `Booking cancelled${reason ? `: ${reason}` : ''}`
  );
}

export async function markNoShow(bookingId: string): Promise<ActionResult<Booking>> {
  return transitionBookingStatus(bookingId, 'no_show', undefined, 'Guest marked as no-show');
}

export async function completeBooking(bookingId: string): Promise<ActionResult<Booking>> {
  return transitionBookingStatus(bookingId, 'completed', undefined, 'Trip completed');
}

// ============================================================================
// Weather Workflow
// ============================================================================

export async function setWeatherHold(
  bookingId: string,
  reason: string
): Promise<ActionResult<Booking>> {
  if (!reason || reason.trim().length === 0) {
    return { success: false, error: 'Weather hold reason is required', code: 'VALIDATION' };
  }

  const result = await transitionBookingStatus(
    bookingId,
    'weather_hold',
    { weather_hold_reason: reason.trim() },
    `Weather hold: ${reason.trim()}`
  );

  if (result.success) {
    await logBookingChange({
      bookingId,
      entryType: 'weather_hold_set',
      description: `Weather hold set: ${reason}`,
      newValue: { weather_hold_reason: reason },
      actorType: 'captain',
    });
  }

  return result;
}

export async function clearWeatherHold(bookingId: string): Promise<ActionResult<Booking>> {
  return transitionBookingStatus(
    bookingId,
    'confirmed',
    { weather_hold_reason: null },
    'Weather hold cleared, booking confirmed'
  );
}

export async function createRescheduleOffers(
  bookingId: string,
  slots: Array<{ start: string; end: string }>
): Promise<ActionResult<RescheduleOffer[]>> {
  if (!bookingId || !isValidUUID(bookingId)) {
    return { success: false, error: 'Invalid booking ID', code: 'VALIDATION' };
  }

  if (!slots || slots.length === 0) {
    return { success: false, error: 'At least one reschedule slot is required', code: 'VALIDATION' };
  }

  const existing = await getBookingById(bookingId);
  if (!existing) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  if (existing.status !== 'weather_hold') {
    return { success: false, error: 'Reschedule offers can only be created for bookings on weather hold', code: 'VALIDATION' };
  }

  // Validate all slots
  for (const slot of slots) {
    if (!isValidTimestamp(slot.start) || !isValidTimestamp(slot.end)) {
      return { success: false, error: 'Invalid slot timestamps', code: 'VALIDATION' };
    }
    if (!isFutureTimestamp(slot.start)) {
      return { success: false, error: 'Reschedule slots must be in the future', code: 'VALIDATION' };
    }
  }

  const supabase = await createSupabaseServerClient();

  // Create offers with 7-day expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const offers = slots.map(slot => ({
    booking_id: bookingId,
    proposed_start: slot.start,
    proposed_end: slot.end,
    is_selected: false,
    expires_at: expiresAt.toISOString(),
  }));

  const { data, error } = await supabase
    .from('reschedule_offers')
    .insert(offers)
    .select();

  if (error || !data) {
    console.error('Error creating reschedule offers:', error);
    return { success: false, error: 'Failed to create reschedule offers', code: 'UNKNOWN' };
  }

  await logBookingChange({
    bookingId,
    entryType: 'rescheduled',
    description: `${slots.length} reschedule options offered to guest`,
    newValue: { offers: slots },
    actorType: 'captain',
  });

  return { success: true, data: data as RescheduleOffer[] };
}

export async function acceptRescheduleOffer(
  bookingId: string,
  offerId: string
): Promise<ActionResult<Booking>> {
  if (!bookingId || !isValidUUID(bookingId) || !offerId || !isValidUUID(offerId)) {
    return { success: false, error: 'Invalid booking or offer ID', code: 'VALIDATION' };
  }

  const existing = await getBookingById(bookingId);
  if (!existing) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  if (existing.status !== 'weather_hold') {
    return { success: false, error: 'Can only accept reschedule for weather hold bookings', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the offer
  const { data: offer, error: offerError } = await supabase
    .from('reschedule_offers')
    .select('*')
    .eq('id', offerId)
    .eq('booking_id', bookingId)
    .single();

  if (offerError || !offer) {
    return { success: false, error: 'Reschedule offer not found', code: 'NOT_FOUND' };
  }

  // Check if offer has expired
  if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
    return { success: false, error: 'Reschedule offer has expired', code: 'VALIDATION' };
  }

  // Check vessel availability for the new time
  if (existing.vessel_id) {
    const vesselAvailability = await checkVesselAvailability({
      vesselId: existing.vessel_id,
      scheduledStart: offer.proposed_start,
      scheduledEnd: offer.proposed_end,
      excludeBookingId: bookingId,
    });
    if (!vesselAvailability.available) {
      return { success: false, error: 'Vessel is no longer available for this time', code: 'CONFLICT' };
    }
  }

  // Update the booking with new schedule
  const { data, error } = await supabase
    .from('bookings')
    .update({
      scheduled_start: offer.proposed_start,
      scheduled_end: offer.proposed_end,
      original_date_if_rescheduled: existing.scheduled_start,
      status: 'rescheduled',
      weather_hold_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error accepting reschedule:', error);
    return { success: false, error: 'Failed to reschedule booking', code: 'UNKNOWN' };
  }

  // Mark the offer as selected
  await supabase
    .from('reschedule_offers')
    .update({ is_selected: true })
    .eq('id', offerId);

  await logBookingChange({
    bookingId,
    entryType: 'rescheduled',
    description: 'Booking rescheduled by guest',
    oldValue: {
      scheduled_start: existing.scheduled_start,
      scheduled_end: existing.scheduled_end,
    },
    newValue: {
      scheduled_start: offer.proposed_start,
      scheduled_end: offer.proposed_end,
    },
    actorType: 'guest',
  });

  return { success: true, data: data as Booking };
}

// ============================================================================
// Payment Status
// ============================================================================

export async function markDepositPaid(
  bookingId: string,
  paymentIntentId: string
): Promise<ActionResult<Booking>> {
  if (!bookingId || !isValidUUID(bookingId)) {
    return { success: false, error: 'Invalid booking ID', code: 'VALIDATION' };
  }

  const existing = await getBookingById(bookingId);
  if (!existing) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  if (existing.status !== 'pending_deposit') {
    return { success: false, error: 'Booking is not pending deposit', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Calculate deposit amount from trip type
  let depositAmount = 0;
  if (existing.trip_type) {
    depositAmount = Math.round(existing.trip_type.deposit_amount * 100);
  }

  // Record the payment
  await supabase.from('payments').insert({
    booking_id: bookingId,
    amount_cents: depositAmount,
    payment_type: 'deposit',
    stripe_payment_intent_id: paymentIntentId,
    status: 'succeeded',
  });

  // Update booking status
  const { data, error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      payment_status: 'deposit_paid',
      deposit_paid_cents: depositAmount,
      balance_due_cents: existing.total_price_cents - depositAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error marking deposit paid:', error);
    return { success: false, error: 'Failed to update payment status', code: 'UNKNOWN' };
  }

  await logBookingChange({
    bookingId,
    entryType: 'payment_received',
    description: `Deposit of $${(depositAmount / 100).toFixed(2)} received`,
    newValue: { deposit_paid_cents: depositAmount, payment_status: 'deposit_paid' },
    actorType: 'system',
  });

  return { success: true, data: data as Booking };
}

export async function markFullyPaid(bookingId: string): Promise<ActionResult<Booking>> {
  if (!bookingId || !isValidUUID(bookingId)) {
    return { success: false, error: 'Invalid booking ID', code: 'VALIDATION' };
  }

  const existing = await getBookingById(bookingId);
  if (!existing) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'fully_paid',
      balance_due_cents: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error marking fully paid:', error);
    return { success: false, error: 'Failed to update payment status', code: 'UNKNOWN' };
  }

  await logBookingChange({
    bookingId,
    entryType: 'payment_received',
    description: 'Booking marked as fully paid',
    newValue: { payment_status: 'fully_paid', balance_due_cents: 0 },
    actorType: 'captain',
  });

  return { success: true, data: data as Booking };
}

// ============================================================================
// Guest Self-Service
// ============================================================================

export async function lookupBookingByToken(
  token: string,
  clientIp?: string
): Promise<ActionResult<BookingWithDetails>> {
  // Rate limiting
  if (clientIp && !checkRateLimit(clientIp)) {
    return { success: false, error: 'Too many lookup attempts. Please try again later.', code: 'UNAUTHORIZED' };
  }

  if (!token || token.length < 6) {
    return { success: false, error: 'Invalid confirmation code', code: 'VALIDATION' };
  }

  const booking = await getBookingByToken(token);
  if (!booking) {
    return { success: false, error: 'Booking not found or code has expired', code: 'NOT_FOUND' };
  }

  return { success: true, data: booking };
}

// ============================================================================
// Guest Reschedule (Token-Based)
// ============================================================================

export interface RescheduleInfoResult {
  booking: BookingWithDetails;
  offers: RescheduleOffer[];
  captain: {
    business_name: string | null;
    full_name: string | null;
  } | null;
}

export async function getBookingRescheduleInfo(
  token: string,
  clientIp?: string
): Promise<ActionResult<RescheduleInfoResult>> {
  // Rate limiting
  if (clientIp && !checkRateLimit(clientIp)) {
    return { success: false, error: 'Too many lookup attempts. Please try again later.', code: 'UNAUTHORIZED' };
  }

  if (!token || token.length < 6) {
    return { success: false, error: 'Invalid confirmation code', code: 'VALIDATION' };
  }

  const booking = await getBookingByToken(token);
  if (!booking) {
    return { success: false, error: 'Booking not found or code has expired', code: 'NOT_FOUND' };
  }

  // Booking must be on weather hold to view reschedule options
  if (booking.status !== 'weather_hold') {
    return {
      success: false,
      error: 'This booking is not currently on weather hold',
      code: 'VALIDATION'
    };
  }

  // Fetch reschedule offers
  const supabase = await createSupabaseServerClient();
  const { data: offers, error: offersError } = await supabase
    .from('reschedule_offers')
    .select('*')
    .eq('booking_id', booking.id)
    .order('proposed_start', { ascending: true });

  if (offersError) {
    console.error('Error fetching reschedule offers:', offersError);
    return { success: false, error: 'Failed to load reschedule options', code: 'UNKNOWN' };
  }

  // Fetch captain info
  const { data: captain } = await supabase
    .from('profiles')
    .select('business_name, full_name')
    .eq('id', booking.captain_id)
    .single();

  return {
    success: true,
    data: {
      booking,
      offers: offers as RescheduleOffer[],
      captain,
    },
  };
}

export async function guestSelectRescheduleOffer(
  token: string,
  offerId: string,
  clientIp?: string
): Promise<ActionResult<Booking>> {
  // Rate limiting
  if (clientIp && !checkRateLimit(clientIp)) {
    return { success: false, error: 'Too many attempts. Please try again later.', code: 'UNAUTHORIZED' };
  }

  if (!token || token.length < 6) {
    return { success: false, error: 'Invalid confirmation code', code: 'VALIDATION' };
  }

  if (!offerId || !isValidUUID(offerId)) {
    return { success: false, error: 'Invalid offer ID', code: 'VALIDATION' };
  }

  const booking = await getBookingByToken(token);
  if (!booking) {
    return { success: false, error: 'Booking not found or code has expired', code: 'NOT_FOUND' };
  }

  if (booking.status !== 'weather_hold') {
    return { success: false, error: 'This booking is not on weather hold', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the offer and verify it belongs to this booking
  const { data: offer, error: offerError } = await supabase
    .from('reschedule_offers')
    .select('*')
    .eq('id', offerId)
    .eq('booking_id', booking.id)
    .single();

  if (offerError || !offer) {
    return { success: false, error: 'Reschedule offer not found', code: 'NOT_FOUND' };
  }

  // Check if offer has expired
  if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
    return { success: false, error: 'This reschedule offer has expired', code: 'VALIDATION' };
  }

  // Check if offer is already selected
  if (offer.is_selected) {
    return { success: false, error: 'This offer has already been selected', code: 'VALIDATION' };
  }

  // Check vessel availability for the new time
  if (booking.vessel_id) {
    const vesselAvailability = await checkVesselAvailability({
      vesselId: booking.vessel_id,
      scheduledStart: offer.proposed_start,
      scheduledEnd: offer.proposed_end,
      excludeBookingId: booking.id,
    });
    if (!vesselAvailability.available) {
      return { success: false, error: 'This time slot is no longer available', code: 'CONFLICT' };
    }
  }

  // Update the booking with new schedule
  const { data, error } = await supabase
    .from('bookings')
    .update({
      scheduled_start: offer.proposed_start,
      scheduled_end: offer.proposed_end,
      original_date_if_rescheduled: booking.scheduled_start,
      status: 'rescheduled',
      weather_hold_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error accepting reschedule:', error);
    return { success: false, error: 'Failed to reschedule booking', code: 'UNKNOWN' };
  }

  // Mark the offer as selected
  await supabase
    .from('reschedule_offers')
    .update({ is_selected: true })
    .eq('id', offerId);

  await logBookingChange({
    bookingId: booking.id,
    entryType: 'rescheduled',
    description: 'Guest selected new date from weather hold offers',
    oldValue: {
      scheduled_start: booking.scheduled_start,
      scheduled_end: booking.scheduled_end,
    },
    newValue: {
      scheduled_start: offer.proposed_start,
      scheduled_end: offer.proposed_end,
    },
    actorType: 'guest',
  });

  return { success: true, data: data as Booking };
}

export async function guestRequestDifferentDates(
  token: string,
  message: string,
  clientIp?: string
): Promise<ActionResult<void>> {
  // Rate limiting
  if (clientIp && !checkRateLimit(clientIp)) {
    return { success: false, error: 'Too many attempts. Please try again later.', code: 'UNAUTHORIZED' };
  }

  if (!token || token.length < 6) {
    return { success: false, error: 'Invalid confirmation code', code: 'VALIDATION' };
  }

  if (!message || message.trim().length === 0) {
    return { success: false, error: 'Please provide a message', code: 'VALIDATION' };
  }

  const booking = await getBookingByToken(token);
  if (!booking) {
    return { success: false, error: 'Booking not found or code has expired', code: 'NOT_FOUND' };
  }

  if (booking.status !== 'weather_hold') {
    return { success: false, error: 'This booking is not on weather hold', code: 'VALIDATION' };
  }

  // Log the request as a guest communication
  await logBookingChange({
    bookingId: booking.id,
    entryType: 'guest_communication',
    description: `Guest requested different reschedule dates: ${message.trim().slice(0, 500)}`,
    newValue: { message: message.trim() },
    actorType: 'guest',
  });

  return { success: true };
}
