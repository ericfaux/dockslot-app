'use server';

/**
 * DockSlot Trip Types Server Actions
 * Handles CRUD operations for trip types
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TripType } from '@/lib/db/types';
import type { SubscriptionTier } from '@/lib/db/types';
import { isAtTripTypeLimit } from '@/lib/subscription/gates';

// ============================================================================
// Types
// ============================================================================

export type TripErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'IN_USE'
  | 'UNKNOWN';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: TripErrorCode;
}

export interface CreateTripTypeParams {
  title: string;
  duration_hours: number;
  price_total: number;
  deposit_amount: number;
  description?: string;
  departure_times?: string[] | null;
  image_url?: string | null;
}

export interface UpdateTripTypeParams {
  title?: string;
  duration_hours?: number;
  price_total?: number;
  deposit_amount?: number;
  description?: string | null;
  departure_times?: string[] | null;
  image_url?: string | null;
}

// ============================================================================
// Validation Helpers
// ============================================================================

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function sanitizeText(text: string | undefined | null, maxLength: number = 500): string | null {
  if (!text) return null;
  return text.trim().slice(0, maxLength);
}

// ============================================================================
// Get Trip Types
// ============================================================================

export async function getTripTypes(): Promise<ActionResult<TripType[]>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Fetch trip types for the captain
  const { data, error } = await supabase
    .from('trip_types')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching trip types:', error);
    return { success: false, error: 'Failed to fetch trip types', code: 'UNKNOWN' };
  }

  return { success: true, data: data as TripType[] };
}

// ============================================================================
// Create Trip Type
// ============================================================================

export async function createTripType(
  params: CreateTripTypeParams
): Promise<ActionResult<TripType>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Check trip type limit for Deckhand plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  if (profile) {
    const tier = profile.subscription_tier as SubscriptionTier;
    const { count } = await supabase
      .from('trip_types')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('is_active', true);

    if (isAtTripTypeLimit(tier, count ?? 0)) {
      return {
        success: false,
        error: 'Upgrade to Captain to create more trip types. The Deckhand plan is limited to 1 trip type.',
        code: 'UNAUTHORIZED' as TripErrorCode,
      };
    }
  }

  // Validate required fields
  const title = sanitizeText(params.title, 100);
  if (!title || title.length === 0) {
    return { success: false, error: 'Title is required', code: 'VALIDATION' };
  }

  if (typeof params.duration_hours !== 'number' || params.duration_hours <= 0) {
    return { success: false, error: 'Duration must be a positive number', code: 'VALIDATION' };
  }

  if (params.duration_hours > 24) {
    return { success: false, error: 'Duration cannot exceed 24 hours', code: 'VALIDATION' };
  }

  if (typeof params.price_total !== 'number' || params.price_total < 0) {
    return { success: false, error: 'Total price must be a non-negative number', code: 'VALIDATION' };
  }

  if (typeof params.deposit_amount !== 'number' || params.deposit_amount < 0) {
    return { success: false, error: 'Deposit amount must be a non-negative number', code: 'VALIDATION' };
  }

  if (params.deposit_amount > params.price_total) {
    return { success: false, error: 'Deposit cannot exceed total price', code: 'VALIDATION' };
  }

  const description = sanitizeText(params.description, 1000);
  const departureTimes = Array.isArray(params.departure_times) && params.departure_times.length > 0
    ? params.departure_times
    : null;

  const imageUrl = sanitizeText(params.image_url, 2000);

  // Create the trip type
  const { data, error } = await supabase
    .from('trip_types')
    .insert({
      owner_id: user.id,
      title,
      duration_hours: params.duration_hours,
      price_total: params.price_total,
      deposit_amount: params.deposit_amount,
      description,
      departure_times: departureTimes,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating trip type:', error);
    return { success: false, error: 'Failed to create trip type', code: 'UNKNOWN' };
  }

  return { success: true, data: data as TripType };
}

// ============================================================================
// Update Trip Type
// ============================================================================

export async function updateTripType(
  tripTypeId: string,
  params: UpdateTripTypeParams
): Promise<ActionResult<TripType>> {
  if (!tripTypeId || !isValidUUID(tripTypeId)) {
    return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Check if trip type exists and belongs to the user
  const { data: existing, error: fetchError } = await supabase
    .from('trip_types')
    .select('*')
    .eq('id', tripTypeId)
    .eq('owner_id', user.id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Trip type not found', code: 'NOT_FOUND' };
  }

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (params.title !== undefined) {
    const title = sanitizeText(params.title, 100);
    if (!title || title.length === 0) {
      return { success: false, error: 'Title is required', code: 'VALIDATION' };
    }
    updateData.title = title;
  }

  if (params.duration_hours !== undefined) {
    if (typeof params.duration_hours !== 'number' || params.duration_hours <= 0) {
      return { success: false, error: 'Duration must be a positive number', code: 'VALIDATION' };
    }
    if (params.duration_hours > 24) {
      return { success: false, error: 'Duration cannot exceed 24 hours', code: 'VALIDATION' };
    }
    updateData.duration_hours = params.duration_hours;
  }

  if (params.price_total !== undefined) {
    if (typeof params.price_total !== 'number' || params.price_total < 0) {
      return { success: false, error: 'Total price must be a non-negative number', code: 'VALIDATION' };
    }
    updateData.price_total = params.price_total;
  }

  if (params.deposit_amount !== undefined) {
    if (typeof params.deposit_amount !== 'number' || params.deposit_amount < 0) {
      return { success: false, error: 'Deposit amount must be a non-negative number', code: 'VALIDATION' };
    }
    updateData.deposit_amount = params.deposit_amount;
  }

  // Validate deposit doesn't exceed total price
  const finalTotal = updateData.price_total ?? existing.price_total;
  const finalDeposit = updateData.deposit_amount ?? existing.deposit_amount;
  if (finalDeposit > finalTotal) {
    return { success: false, error: 'Deposit cannot exceed total price', code: 'VALIDATION' };
  }

  if (params.description !== undefined) {
    updateData.description = sanitizeText(params.description, 1000);
  }

  if (params.departure_times !== undefined) {
    updateData.departure_times = Array.isArray(params.departure_times) && params.departure_times.length > 0
      ? params.departure_times
      : null;
  }

  if (params.image_url !== undefined) {
    updateData.image_url = sanitizeText(params.image_url, 2000);
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'No valid updates provided', code: 'VALIDATION' };
  }

  // Update the trip type
  const { data, error } = await supabase
    .from('trip_types')
    .update(updateData)
    .eq('id', tripTypeId)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating trip type:', error);
    return { success: false, error: 'Failed to update trip type', code: 'UNKNOWN' };
  }

  return { success: true, data: data as TripType };
}

// ============================================================================
// Delete Trip Type
// ============================================================================

export async function deleteTripType(
  tripTypeId: string
): Promise<ActionResult<{ deleted: boolean; archived?: boolean }>> {
  if (!tripTypeId || !isValidUUID(tripTypeId)) {
    return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Check if trip type exists and belongs to the user
  const { data: existing, error: fetchError } = await supabase
    .from('trip_types')
    .select('id')
    .eq('id', tripTypeId)
    .eq('owner_id', user.id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Trip type not found', code: 'NOT_FOUND' };
  }

  // Check if any bookings reference this trip type (any status)
  const { data: anyBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('trip_type_id', tripTypeId)
    .limit(1);

  if (anyBookings && anyBookings.length > 0) {
    // Soft delete: archive the trip type so historical bookings remain valid
    const { error } = await supabase
      .from('trip_types')
      .update({ is_active: false })
      .eq('id', tripTypeId)
      .eq('owner_id', user.id);

    if (error) {
      console.error('Error archiving trip type:', error);
      return { success: false, error: 'Failed to archive trip type', code: 'UNKNOWN' };
    }

    return { success: true, data: { deleted: true, archived: true } };
  }

  // No bookings reference this trip type — safe to hard delete
  const { error } = await supabase
    .from('trip_types')
    .delete()
    .eq('id', tripTypeId)
    .eq('owner_id', user.id);

  if (error) {
    console.error('Error deleting trip type:', error);
    return { success: false, error: 'Failed to delete trip type', code: 'UNKNOWN' };
  }

  return { success: true, data: { deleted: true } };
}

// ============================================================================
// Reactivate (Restore) Trip Type
// ============================================================================

export async function reactivateTripType(
  tripTypeId: string
): Promise<ActionResult<TripType>> {
  if (!tripTypeId || !isValidUUID(tripTypeId)) {
    return { success: false, error: 'Invalid trip type ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Restore: set is_active back to true
  const { data, error } = await supabase
    .from('trip_types')
    .update({ is_active: true })
    .eq('id', tripTypeId)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error reactivating trip type:', error);
    return { success: false, error: 'Trip type not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: data as TripType };
}
