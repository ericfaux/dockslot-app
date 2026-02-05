'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';
import { headers } from 'next/headers';
import {
  WaiverTemplate,
  WaiverSignature,
  Passenger,
  BookingWithDetails,
} from '@/lib/db/types';
import { isValidUUID, sanitizeName } from '@/lib/utils/validation';

// ============================================================================
// Types
// ============================================================================

export type WaiverErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'EXPIRED'
  | 'ALREADY_SIGNED'
  | 'DATABASE';

export interface WaiverActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: WaiverErrorCode;
}

export interface PassengerWaiverStatus {
  passenger: Passenger;
  signedWaivers: string[]; // waiver_template_ids that have been signed
  pendingWaivers: string[]; // waiver_template_ids that need to be signed
  isComplete: boolean;
}

export interface BookingWaiverInfo {
  booking: BookingWithDetails & {
    captain: {
      id: string;
      business_name: string | null;
      full_name: string | null;
    };
  };
  passengers: PassengerWaiverStatus[];
  requiredWaivers: WaiverTemplate[];
  totalSigned: number;
  totalRequired: number;
  allComplete: boolean;
}

export interface WaiverForSigning {
  template: WaiverTemplate;
  passenger: Passenger;
  booking: BookingWithDetails;
  alreadySigned: boolean;
}

export interface WaiverDeviceInfo {
  user_agent: string;
  platform: string;
  language: string;
  screen_width: number;
  screen_height: number;
  timezone: string;
}

export interface SubmitSignatureParams {
  token: string;
  passengerId: string;
  waiverTemplateId: string;
  signatureData: string; // base64 image
  agreedToTerms: boolean;
  deviceInfo?: WaiverDeviceInfo | null;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Get booking and waiver status by guest token
 */
export async function getBookingWaiverInfo(
  token: string
): Promise<WaiverActionResult<BookingWaiverInfo>> {
  if (!token || token.length < 10) {
    return { success: false, error: 'Invalid token', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Find the valid token
  const { data: tokenData, error: tokenError } = await supabase
    .from('guest_tokens')
    .select('booking_id, expires_at')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return { success: false, error: 'This link has expired', code: 'EXPIRED' };
  }

  // Get the booking with details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id, captain_id, trip_type_id, vessel_id, guest_name, guest_email,
      guest_phone, party_size, scheduled_start, scheduled_end, status,
      payment_status, total_price_cents, deposit_paid_cents, balance_due_cents,
      special_requests, created_at, updated_at,
      vessel:vessels(id, name, capacity),
      trip_type:trip_types(id, title, duration_hours, price_total, deposit_amount),
      captain:profiles!bookings_captain_id_fkey(id, business_name, full_name)
    `)
    .eq('id', tokenData.booking_id)
    .single();

  if (bookingError || !booking) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  // Get passengers for this booking
  const { data: passengers, error: passengersError } = await supabase
    .from('passengers')
    .select('*')
    .eq('booking_id', tokenData.booking_id)
    .order('is_primary_contact', { ascending: false })
    .order('created_at', { ascending: true });

  if (passengersError) {
    return { success: false, error: 'Failed to load passengers', code: 'DATABASE' };
  }

  // Get required waivers for this captain
  const { data: waivers, error: waiversError } = await supabase
    .from('waiver_templates')
    .select('*')
    .eq('owner_id', booking.captain_id)
    .eq('is_active', true)
    .order('title', { ascending: true });

  if (waiversError) {
    return { success: false, error: 'Failed to load waivers', code: 'DATABASE' };
  }

  const requiredWaivers = (waivers || []) as WaiverTemplate[];

  // Get existing signatures for this booking
  const { data: signatures, error: signaturesError } = await supabase
    .from('waiver_signatures')
    .select('passenger_id, waiver_template_id')
    .eq('booking_id', tokenData.booking_id);

  if (signaturesError) {
    return { success: false, error: 'Failed to load signature status', code: 'DATABASE' };
  }

  // Build signature map: passenger_id -> Set of signed waiver_template_ids
  const signatureMap = new Map<string, Set<string>>();
  for (const sig of signatures || []) {
    if (sig.passenger_id) {
      if (!signatureMap.has(sig.passenger_id)) {
        signatureMap.set(sig.passenger_id, new Set());
      }
      signatureMap.get(sig.passenger_id)!.add(sig.waiver_template_id);
    }
  }

  // Calculate status for each passenger
  const passengerStatuses: PassengerWaiverStatus[] = (passengers || []).map((passenger) => {
    const signedSet = signatureMap.get(passenger.id) || new Set<string>();
    const signedWaivers = requiredWaivers
      .filter((w) => signedSet.has(w.id))
      .map((w) => w.id);
    const pendingWaivers = requiredWaivers
      .filter((w) => !signedSet.has(w.id))
      .map((w) => w.id);

    return {
      passenger: passenger as Passenger,
      signedWaivers,
      pendingWaivers,
      isComplete: pendingWaivers.length === 0 && requiredWaivers.length > 0,
    };
  });

  // Calculate totals
  const totalRequired = (passengers || []).length * requiredWaivers.length;
  const totalSigned = passengerStatuses.reduce(
    (sum, ps) => sum + ps.signedWaivers.length,
    0
  );

  // Transform vessel and trip_type arrays to single objects
  const transformedBooking = {
    ...booking,
    vessel: Array.isArray(booking.vessel) ? booking.vessel[0] || null : booking.vessel,
    trip_type: Array.isArray(booking.trip_type) ? booking.trip_type[0] || null : booking.trip_type,
    captain: Array.isArray(booking.captain) ? booking.captain[0] : booking.captain,
  };

  return {
    success: true,
    data: {
      booking: transformedBooking as BookingWaiverInfo['booking'],
      passengers: passengerStatuses,
      requiredWaivers,
      totalSigned,
      totalRequired,
      allComplete: totalSigned === totalRequired && totalRequired > 0,
    },
  };
}

/**
 * Get waiver details for signing
 */
export async function getWaiverForSigning(
  token: string,
  passengerId: string
): Promise<WaiverActionResult<WaiverForSigning>> {
  if (!token || token.length < 10) {
    return { success: false, error: 'Invalid token', code: 'VALIDATION' };
  }
  if (!passengerId || !isValidUUID(passengerId)) {
    return { success: false, error: 'Invalid passenger ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Find the valid token
  const { data: tokenData, error: tokenError } = await supabase
    .from('guest_tokens')
    .select('booking_id, expires_at')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return { success: false, error: 'This link has expired', code: 'EXPIRED' };
  }

  // Get the booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      id, captain_id, trip_type_id, vessel_id, guest_name, guest_email,
      guest_phone, party_size, scheduled_start, scheduled_end, status,
      payment_status, total_price_cents, deposit_paid_cents, balance_due_cents,
      special_requests, created_at, updated_at,
      vessel:vessels(id, name, capacity),
      trip_type:trip_types(id, title, duration_hours, price_total, deposit_amount)
    `)
    .eq('id', tokenData.booking_id)
    .single();

  if (bookingError || !booking) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  // Get the passenger and verify they belong to this booking
  const { data: passenger, error: passengerError } = await supabase
    .from('passengers')
    .select('*')
    .eq('id', passengerId)
    .eq('booking_id', tokenData.booking_id)
    .single();

  if (passengerError || !passenger) {
    return { success: false, error: 'Passenger not found', code: 'NOT_FOUND' };
  }

  // Get the first required waiver that hasn't been signed
  const { data: waivers, error: waiversError } = await supabase
    .from('waiver_templates')
    .select('*')
    .eq('owner_id', booking.captain_id)
    .eq('is_active', true)
    .order('title', { ascending: true });

  if (waiversError || !waivers || waivers.length === 0) {
    return { success: false, error: 'No waivers configured', code: 'NOT_FOUND' };
  }

  // Check which waivers have already been signed
  const { data: signatures } = await supabase
    .from('waiver_signatures')
    .select('waiver_template_id')
    .eq('booking_id', tokenData.booking_id)
    .eq('passenger_id', passengerId);

  const signedWaiverIds = new Set((signatures || []).map((s) => s.waiver_template_id));

  // Find the first unsigned waiver
  const unsignedWaiver = waivers.find((w) => !signedWaiverIds.has(w.id));

  if (!unsignedWaiver) {
    return {
      success: false,
      error: 'All waivers have been signed',
      code: 'ALREADY_SIGNED',
    };
  }

  // Transform booking data
  const transformedBooking = {
    ...booking,
    vessel: Array.isArray(booking.vessel) ? booking.vessel[0] || null : booking.vessel,
    trip_type: Array.isArray(booking.trip_type) ? booking.trip_type[0] || null : booking.trip_type,
  } as BookingWithDetails;

  return {
    success: true,
    data: {
      template: unsignedWaiver as WaiverTemplate,
      passenger: passenger as Passenger,
      booking: transformedBooking,
      alreadySigned: false,
    },
  };
}

/**
 * Submit a waiver signature
 */
export async function submitWaiverSignature(
  params: SubmitSignatureParams
): Promise<WaiverActionResult<{ remainingWaivers: number }>> {
  const { token, passengerId, waiverTemplateId, signatureData, agreedToTerms, deviceInfo } = params;

  // Validate inputs
  if (!token || token.length < 10) {
    return { success: false, error: 'Invalid token', code: 'VALIDATION' };
  }
  if (!passengerId || !isValidUUID(passengerId)) {
    return { success: false, error: 'Invalid passenger ID', code: 'VALIDATION' };
  }
  if (!waiverTemplateId || !isValidUUID(waiverTemplateId)) {
    return { success: false, error: 'Invalid waiver ID', code: 'VALIDATION' };
  }
  if (!signatureData || !signatureData.startsWith('data:image/')) {
    return { success: false, error: 'Invalid signature data', code: 'VALIDATION' };
  }
  if (!agreedToTerms) {
    return { success: false, error: 'You must agree to the terms', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Find the valid token
  const { data: tokenData, error: tokenError } = await supabase
    .from('guest_tokens')
    .select('booking_id, expires_at')
    .eq('token', token)
    .single();

  if (tokenError || !tokenData) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  // Check if token is expired
  if (new Date(tokenData.expires_at) < new Date()) {
    return { success: false, error: 'This link has expired', code: 'EXPIRED' };
  }

  // Verify passenger belongs to this booking
  const { data: passenger, error: passengerError } = await supabase
    .from('passengers')
    .select('id, full_name, email')
    .eq('id', passengerId)
    .eq('booking_id', tokenData.booking_id)
    .single();

  if (passengerError || !passenger) {
    return { success: false, error: 'Passenger not found', code: 'NOT_FOUND' };
  }

  // Verify waiver template exists and belongs to the captain
  const { data: booking } = await supabase
    .from('bookings')
    .select('captain_id')
    .eq('id', tokenData.booking_id)
    .single();

  if (!booking) {
    return { success: false, error: 'Booking not found', code: 'NOT_FOUND' };
  }

  const { data: waiver, error: waiverError } = await supabase
    .from('waiver_templates')
    .select('id, version')
    .eq('id', waiverTemplateId)
    .eq('owner_id', booking.captain_id)
    .eq('is_active', true)
    .single();

  if (waiverError || !waiver) {
    return { success: false, error: 'Waiver not found', code: 'NOT_FOUND' };
  }

  // Check if already signed
  const { data: existingSignature } = await supabase
    .from('waiver_signatures')
    .select('id')
    .eq('booking_id', tokenData.booking_id)
    .eq('passenger_id', passengerId)
    .eq('waiver_template_id', waiverTemplateId)
    .single();

  if (existingSignature) {
    return { success: false, error: 'This waiver has already been signed', code: 'ALREADY_SIGNED' };
  }

  // Get IP address from request headers
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0]?.trim() || headersList.get('x-real-ip') || null;

  // Insert the signature
  const { error: insertError } = await supabase.from('waiver_signatures').insert({
    booking_id: tokenData.booking_id,
    passenger_id: passengerId,
    waiver_template_id: waiverTemplateId,
    signer_name: sanitizeName(passenger.full_name),
    signer_email: passenger.email,
    signed_at: new Date().toISOString(),
    ip_address: ipAddress,
    signature_data: signatureData,
    template_version: waiver.version,
    device_info: deviceInfo || null,
  });

  if (insertError) {
    console.error('Failed to save signature:', insertError);
    return { success: false, error: 'Failed to save signature', code: 'DATABASE' };
  }

  // Log the waiver signing
  await supabase.from('booking_logs').insert({
    booking_id: tokenData.booking_id,
    entry_type: 'waiver_signed',
    description: `Waiver signed by ${passenger.full_name}`,
    actor_type: 'guest',
    actor_id: null,
    new_value: {
      passenger_id: passengerId,
      passenger_name: passenger.full_name,
      waiver_template_id: waiverTemplateId,
    },
  });

  // Count remaining unsigned waivers for this passenger
  const { data: allWaivers } = await supabase
    .from('waiver_templates')
    .select('id')
    .eq('owner_id', booking.captain_id)
    .eq('is_active', true);

  const { data: signedWaivers } = await supabase
    .from('waiver_signatures')
    .select('waiver_template_id')
    .eq('booking_id', tokenData.booking_id)
    .eq('passenger_id', passengerId);

  const signedIds = new Set((signedWaivers || []).map((s) => s.waiver_template_id));
  const remainingWaivers = (allWaivers || []).filter((w) => !signedIds.has(w.id)).length;

  return {
    success: true,
    data: { remainingWaivers },
  };
}

/**
 * Get all waiver templates for a captain (for admin/setup)
 */
export async function getWaiverTemplates(
  captainId: string
): Promise<WaiverActionResult<WaiverTemplate[]>> {
  if (!captainId || !isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('waiver_templates')
    .select('*')
    .eq('owner_id', captainId)
    .order('title', { ascending: true });

  if (error) {
    return { success: false, error: 'Failed to load waivers', code: 'DATABASE' };
  }

  return { success: true, data: (data || []) as WaiverTemplate[] };
}

/**
 * Toggle waiver template active status
 */
export async function toggleWaiverTemplate(
  templateId: string
): Promise<WaiverActionResult<{ is_active: boolean }>> {
  if (!templateId || !isValidUUID(templateId)) {
    return { success: false, error: 'Invalid template ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated', code: 'VALIDATION' };
  }

  // Get current status
  const { data: template, error: fetchError } = await supabase
    .from('waiver_templates')
    .select('is_active, owner_id')
    .eq('id', templateId)
    .single();

  if (fetchError || !template) {
    return { success: false, error: 'Template not found', code: 'NOT_FOUND' };
  }

  // Verify ownership
  if (template.owner_id !== user.id) {
    return { success: false, error: 'Not authorized', code: 'VALIDATION' };
  }

  // Toggle
  const { data, error } = await supabase
    .from('waiver_templates')
    .update({ is_active: !template.is_active })
    .eq('id', templateId)
    .select('is_active')
    .single();

  if (error) {
    return { success: false, error: 'Failed to update template', code: 'DATABASE' };
  }

  return { success: true, data: { is_active: data.is_active } };
}

/**
 * Delete a waiver template
 */
export async function deleteWaiverTemplate(
  templateId: string
): Promise<WaiverActionResult<null>> {
  if (!templateId || !isValidUUID(templateId)) {
    return { success: false, error: 'Invalid template ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated', code: 'VALIDATION' };
  }

  // Verify ownership
  const { data: template, error: fetchError } = await supabase
    .from('waiver_templates')
    .select('owner_id')
    .eq('id', templateId)
    .single();

  if (fetchError || !template) {
    return { success: false, error: 'Template not found', code: 'NOT_FOUND' };
  }

  if (template.owner_id !== user.id) {
    return { success: false, error: 'Not authorized', code: 'VALIDATION' };
  }

  // Check if any signatures exist for this template
  const { data: signatures } = await supabase
    .from('waiver_signatures')
    .select('id')
    .eq('waiver_template_id', templateId)
    .limit(1);

  if (signatures && signatures.length > 0) {
    return { 
      success: false, 
      error: 'Cannot delete template that has been signed. Deactivate it instead.', 
      code: 'VALIDATION' 
    };
  }

  // Delete
  const { error } = await supabase
    .from('waiver_templates')
    .delete()
    .eq('id', templateId);

  if (error) {
    return { success: false, error: 'Failed to delete template', code: 'DATABASE' };
  }

  return { success: true, data: null };
}

/**
 * Create a new waiver template
 */
export async function createWaiverTemplate(
  data: {
    title: string;
    content: string;
    is_active: boolean;
  }
): Promise<WaiverActionResult<{ id: string }>> {
  const { title, content, is_active } = data;

  if (!title || title.trim().length < 3) {
    return { success: false, error: 'Title must be at least 3 characters', code: 'VALIDATION' };
  }

  if (!content || content.trim().length < 50) {
    return { success: false, error: 'Content must be at least 50 characters', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated', code: 'VALIDATION' };
  }

  const { data: template, error } = await supabase
    .from('waiver_templates')
    .insert({
      owner_id: user.id,
      title: title.trim(),
      content: content.trim(),
      is_active,
      version: 1,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Failed to create waiver template:', error);
    return { success: false, error: 'Failed to create template', code: 'DATABASE' };
  }

  return { success: true, data: { id: template.id } };
}

/**
 * Update an existing waiver template
 */
export async function updateWaiverTemplate(
  templateId: string,
  data: {
    title: string;
    content: string;
    is_active: boolean;
  }
): Promise<WaiverActionResult<null>> {
  if (!templateId || !isValidUUID(templateId)) {
    return { success: false, error: 'Invalid template ID', code: 'VALIDATION' };
  }

  const { title, content, is_active } = data;

  if (!title || title.trim().length < 3) {
    return { success: false, error: 'Title must be at least 3 characters', code: 'VALIDATION' };
  }

  if (!content || content.trim().length < 50) {
    return { success: false, error: 'Content must be at least 50 characters', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated', code: 'VALIDATION' };
  }

  // Verify ownership and get current version
  const { data: template, error: fetchError } = await supabase
    .from('waiver_templates')
    .select('owner_id, version')
    .eq('id', templateId)
    .single();

  if (fetchError || !template) {
    return { success: false, error: 'Template not found', code: 'NOT_FOUND' };
  }

  if (template.owner_id !== user.id) {
    return { success: false, error: 'Not authorized', code: 'VALIDATION' };
  }

  // Update with version increment
  const { error } = await supabase
    .from('waiver_templates')
    .update({
      title: title.trim(),
      content: content.trim(),
      is_active,
      version: (template.version || 1) + 1,
    })
    .eq('id', templateId);

  if (error) {
    console.error('Failed to update waiver template:', error);
    return { success: false, error: 'Failed to update template', code: 'DATABASE' };
  }

  return { success: true, data: null };
}
