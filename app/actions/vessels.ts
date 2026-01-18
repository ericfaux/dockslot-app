'use server';

/**
 * DockSlot Vessels Server Actions
 * Handles CRUD operations for vessels
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Vessel } from '@/lib/db/types';

// ============================================================================
// Types
// ============================================================================

export type VesselErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'IN_USE'
  | 'UNKNOWN';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: VesselErrorCode;
}

export interface CreateVesselParams {
  name: string;
  capacity: number;
  description?: string;
}

export interface UpdateVesselParams {
  name?: string;
  capacity?: number;
  description?: string | null;
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
// Get Vessels
// ============================================================================

export async function getVessels(): Promise<ActionResult<Vessel[]>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Fetch vessels for the captain
  const { data, error } = await supabase
    .from('vessels')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching vessels:', error);
    return { success: false, error: 'Failed to fetch vessels', code: 'UNKNOWN' };
  }

  return { success: true, data: data as Vessel[] };
}

// ============================================================================
// Create Vessel
// ============================================================================

export async function createVessel(
  params: CreateVesselParams
): Promise<ActionResult<Vessel>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Validate required fields
  const name = sanitizeText(params.name, 100);
  if (!name || name.length === 0) {
    return { success: false, error: 'Vessel name is required', code: 'VALIDATION' };
  }

  if (typeof params.capacity !== 'number' || params.capacity <= 0) {
    return { success: false, error: 'Capacity must be a positive number', code: 'VALIDATION' };
  }

  if (!Number.isInteger(params.capacity)) {
    return { success: false, error: 'Capacity must be a whole number', code: 'VALIDATION' };
  }

  if (params.capacity > 100) {
    return { success: false, error: 'Capacity cannot exceed 100 passengers', code: 'VALIDATION' };
  }

  const description = sanitizeText(params.description, 1000);

  // Create the vessel
  const { data, error } = await supabase
    .from('vessels')
    .insert({
      owner_id: user.id,
      name,
      capacity: params.capacity,
      description,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating vessel:', error);
    return { success: false, error: 'Failed to create vessel', code: 'UNKNOWN' };
  }

  return { success: true, data: data as Vessel };
}

// ============================================================================
// Update Vessel
// ============================================================================

export async function updateVessel(
  vesselId: string,
  params: UpdateVesselParams
): Promise<ActionResult<Vessel>> {
  if (!vesselId || !isValidUUID(vesselId)) {
    return { success: false, error: 'Invalid vessel ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Check if vessel exists and belongs to the user
  const { data: existing, error: fetchError } = await supabase
    .from('vessels')
    .select('*')
    .eq('id', vesselId)
    .eq('owner_id', user.id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Vessel not found', code: 'NOT_FOUND' };
  }

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (params.name !== undefined) {
    const name = sanitizeText(params.name, 100);
    if (!name || name.length === 0) {
      return { success: false, error: 'Vessel name is required', code: 'VALIDATION' };
    }
    updateData.name = name;
  }

  if (params.capacity !== undefined) {
    if (typeof params.capacity !== 'number' || params.capacity <= 0) {
      return { success: false, error: 'Capacity must be a positive number', code: 'VALIDATION' };
    }
    if (!Number.isInteger(params.capacity)) {
      return { success: false, error: 'Capacity must be a whole number', code: 'VALIDATION' };
    }
    if (params.capacity > 100) {
      return { success: false, error: 'Capacity cannot exceed 100 passengers', code: 'VALIDATION' };
    }
    updateData.capacity = params.capacity;
  }

  if (params.description !== undefined) {
    updateData.description = sanitizeText(params.description, 1000);
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'No valid updates provided', code: 'VALIDATION' };
  }

  // Update the vessel
  const { data, error } = await supabase
    .from('vessels')
    .update(updateData)
    .eq('id', vesselId)
    .eq('owner_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating vessel:', error);
    return { success: false, error: 'Failed to update vessel', code: 'UNKNOWN' };
  }

  return { success: true, data: data as Vessel };
}

// ============================================================================
// Delete Vessel
// ============================================================================

export async function deleteVessel(
  vesselId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  if (!vesselId || !isValidUUID(vesselId)) {
    return { success: false, error: 'Invalid vessel ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Check if vessel exists and belongs to the user
  const { data: existing, error: fetchError } = await supabase
    .from('vessels')
    .select('id')
    .eq('id', vesselId)
    .eq('owner_id', user.id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Vessel not found', code: 'NOT_FOUND' };
  }

  // Check if vessel is in use by any active bookings
  const { data: activeBookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('vessel_id', vesselId)
    .in('status', ['pending_deposit', 'confirmed', 'weather_hold', 'rescheduled'])
    .limit(1);

  if (activeBookings && activeBookings.length > 0) {
    return {
      success: false,
      error: 'Cannot delete vessel: it is currently assigned to active bookings',
      code: 'IN_USE',
    };
  }

  // Delete the vessel
  const { error } = await supabase
    .from('vessels')
    .delete()
    .eq('id', vesselId)
    .eq('owner_id', user.id);

  if (error) {
    console.error('Error deleting vessel:', error);
    return { success: false, error: 'Failed to delete vessel', code: 'UNKNOWN' };
  }

  return { success: true, data: { deleted: true } };
}
