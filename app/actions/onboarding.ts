'use server';

/**
 * DockSlot Onboarding Server Actions
 * Handles saving onboarding wizard progress and step data
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export interface OnboardingActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SaveProfileStepParams {
  full_name: string;
  business_name: string;
  phone: string;
  timezone: string;
}

export interface SaveMeetingSpotParams {
  meeting_spot_name: string;
  meeting_spot_address: string;
  meeting_spot_latitude: number | null;
  meeting_spot_longitude: number | null;
}

export interface SaveVesselParams {
  name: string;
  capacity: number;
}

export interface SaveTripTypeParams {
  title: string;
  duration_hours: number;
  price_total: number;
  deposit_amount: number;
}

export interface AvailabilityDayInput {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// ============================================================================
// Helpers
// ============================================================================

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { user: null, supabase };
  return { user, supabase };
}

// ============================================================================
// Update Onboarding Step
// ============================================================================

export async function updateOnboardingStep(
  step: number
): Promise<OnboardingActionResult> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_step: step, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating onboarding step:', error);
    return { success: false, error: 'Failed to update progress' };
  }

  return { success: true };
}

// ============================================================================
// Complete Onboarding
// ============================================================================

export async function completeOnboarding(): Promise<OnboardingActionResult> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('profiles')
    .update({
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error completing onboarding:', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }

  return { success: true };
}

// ============================================================================
// Step 1: Save Profile Info
// ============================================================================

export async function saveProfileStep(
  params: SaveProfileStepParams
): Promise<OnboardingActionResult> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (!params.full_name?.trim()) {
    return { success: false, error: 'Full name is required' };
  }
  if (!params.business_name?.trim()) {
    return { success: false, error: 'Business name is required' };
  }

  // Auto-generate a booking slug from the business name
  const businessName = params.business_name.trim();
  let baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
    .replace(/-$/, '');

  if (baseSlug.length < 3) {
    baseSlug = (baseSlug + '-charter').slice(0, 50);
  }

  // Check uniqueness and append number if needed
  let bookingSlug = baseSlug;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('booking_slug', bookingSlug)
      .neq('id', user.id)
      .single();

    if (!existing) break;
    counter++;
    bookingSlug = `${baseSlug.slice(0, 50 - String(counter).length - 1)}-${counter}`;
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: params.full_name.trim(),
      business_name: businessName,
      phone: params.phone?.trim() || null,
      timezone: params.timezone || 'America/New_York',
      booking_slug: bookingSlug,
      onboarding_step: 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error saving profile step:', error);
    return { success: false, error: 'Failed to save profile' };
  }

  return { success: true };
}

// ============================================================================
// Step 2: Save Meeting Spot
// ============================================================================

export async function saveMeetingSpotStep(
  params: SaveMeetingSpotParams
): Promise<OnboardingActionResult> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (!params.meeting_spot_name?.trim()) {
    return { success: false, error: 'Location name is required' };
  }
  if (!params.meeting_spot_address?.trim()) {
    return { success: false, error: 'Address is required' };
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      meeting_spot_name: params.meeting_spot_name.trim(),
      meeting_spot_address: params.meeting_spot_address.trim(),
      meeting_spot_latitude: params.meeting_spot_latitude,
      meeting_spot_longitude: params.meeting_spot_longitude,
      onboarding_step: 2,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error saving meeting spot:', error);
    return { success: false, error: 'Failed to save meeting spot' };
  }

  return { success: true };
}

// ============================================================================
// Step 3: Save Vessel
// ============================================================================

export async function saveVesselStep(
  params: SaveVesselParams
): Promise<OnboardingActionResult<{ vesselId: string }>> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (!params.name?.trim()) {
    return { success: false, error: 'Vessel name is required' };
  }
  if (!params.capacity || params.capacity < 1 || params.capacity > 100) {
    return { success: false, error: 'Capacity must be between 1 and 100' };
  }

  const { data: vessel, error } = await supabase
    .from('vessels')
    .insert({
      owner_id: user.id,
      name: params.name.trim(),
      capacity: Math.floor(params.capacity),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving vessel:', error);
    return { success: false, error: 'Failed to save vessel' };
  }

  // Update onboarding step
  await supabase
    .from('profiles')
    .update({ onboarding_step: 3, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  return { success: true, data: { vesselId: vessel.id } };
}

// ============================================================================
// Step 4: Save Trip Type
// ============================================================================

export async function saveTripTypeStep(
  params: SaveTripTypeParams
): Promise<OnboardingActionResult> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (!params.title?.trim()) {
    return { success: false, error: 'Trip name is required' };
  }
  if (params.duration_hours <= 0 || params.duration_hours > 24) {
    return { success: false, error: 'Duration must be between 0.5 and 24 hours' };
  }
  if (params.price_total < 0) {
    return { success: false, error: 'Price must be non-negative' };
  }
  if (params.deposit_amount < 0 || params.deposit_amount > params.price_total) {
    return { success: false, error: 'Deposit must be between 0 and the total price' };
  }

  const { error } = await supabase
    .from('trip_types')
    .insert({
      owner_id: user.id,
      title: params.title.trim(),
      duration_hours: params.duration_hours,
      price_total: params.price_total,
      deposit_amount: params.deposit_amount,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving trip type:', error);
    return { success: false, error: 'Failed to save trip type' };
  }

  // Update onboarding step
  await supabase
    .from('profiles')
    .update({ onboarding_step: 4, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  return { success: true };
}

// ============================================================================
// Step 5: Save Availability
// ============================================================================

export async function saveAvailabilityStep(
  windows: AvailabilityDayInput[]
): Promise<OnboardingActionResult> {
  const { user, supabase } = await getAuthenticatedUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (!Array.isArray(windows) || windows.length !== 7) {
    return { success: false, error: 'Must provide availability for all 7 days' };
  }

  // Normalize time format to HH:MM:SS
  const normalizeTime = (t: string) => t.length === 5 ? `${t}:00` : t;

  const upsertData = windows.map(w => ({
    owner_id: user.id,
    day_of_week: w.day_of_week,
    start_time: normalizeTime(w.start_time),
    end_time: normalizeTime(w.end_time),
    is_active: w.is_active,
  }));

  const { error } = await supabase
    .from('availability_windows')
    .upsert(upsertData, {
      onConflict: 'owner_id,day_of_week',
      ignoreDuplicates: false,
    });

  if (error) {
    console.error('Error saving availability:', error);
    return { success: false, error: 'Failed to save availability' };
  }

  // Update onboarding step
  await supabase
    .from('profiles')
    .update({ onboarding_step: 5, updated_at: new Date().toISOString() })
    .eq('id', user.id);

  return { success: true };
}
