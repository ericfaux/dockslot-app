'use server';

/**
 * DockSlot Blackout Date Server Actions
 * Handles CRUD operations for blackout dates
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================================================
// Types
// ============================================================================

export type BlackoutErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'DUPLICATE'
  | 'UNKNOWN';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: BlackoutErrorCode;
}

export interface BlackoutDate {
  id: string;
  owner_id: string;
  blackout_date: string;
  reason: string | null;
  created_at: string;
}

// ============================================================================
// Validation Helpers
// ============================================================================

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function isValidDateString(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return false;
  const date = new Date(dateStr + 'T12:00:00');
  return !isNaN(date.getTime());
}

function sanitizeReason(reason: string | null | undefined): string | null {
  if (!reason) return null;
  return reason.trim().slice(0, 500) || null;
}

// ============================================================================
// Get Blackout Dates
// ============================================================================

export async function getBlackoutDates(
  captainId: string,
  startDate: Date,
  endDate: Date
): Promise<ActionResult<BlackoutDate[]>> {
  // Validate captainId
  if (!isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Ensure user can only fetch their own blackout dates
  if (user.id !== captainId) {
    return { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' };
  }

  // Format dates for query
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Fetch blackout dates in range
  const { data, error } = await supabase
    .from('blackout_dates')
    .select('*')
    .eq('owner_id', captainId)
    .gte('blackout_date', startDateStr)
    .lte('blackout_date', endDateStr)
    .order('blackout_date', { ascending: true });

  if (error) {
    console.error('Error fetching blackout dates:', error);
    return { success: false, error: 'Failed to fetch blackout dates', code: 'UNKNOWN' };
  }

  return { success: true, data: data as BlackoutDate[] };
}

// ============================================================================
// Create Single Blackout Date
// ============================================================================

export async function createBlackoutDate(
  captainId: string,
  date: Date,
  reason?: string
): Promise<ActionResult<BlackoutDate>> {
  // Validate captainId
  if (!isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Ensure user can only create their own blackout dates
  if (user.id !== captainId) {
    return { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' };
  }

  const dateStr = date.toISOString().split('T')[0];
  const sanitizedReason = sanitizeReason(reason);

  // Check if blackout already exists for this date
  const { data: existing } = await supabase
    .from('blackout_dates')
    .select('id')
    .eq('owner_id', captainId)
    .eq('blackout_date', dateStr)
    .single();

  if (existing) {
    return { success: false, error: 'This date is already blocked', code: 'DUPLICATE' };
  }

  // Insert the blackout date
  const { data, error } = await supabase
    .from('blackout_dates')
    .insert({
      owner_id: captainId,
      blackout_date: dateStr,
      reason: sanitizedReason,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating blackout date:', error);
    return { success: false, error: 'Failed to create blackout date', code: 'UNKNOWN' };
  }

  revalidatePath('/dashboard/schedule');
  return { success: true, data: data as BlackoutDate };
}

// ============================================================================
// Create Blackout Date Range
// ============================================================================

export async function createBlackoutDateRange(
  captainId: string,
  startDate: Date,
  endDate: Date,
  reason?: string
): Promise<ActionResult<BlackoutDate[]>> {
  // Validate captainId
  if (!isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  // Validate date range
  if (startDate > endDate) {
    return { success: false, error: 'Start date must be before or equal to end date', code: 'VALIDATION' };
  }

  // Limit range to prevent abuse (max 60 days)
  const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 60) {
    return { success: false, error: 'Date range cannot exceed 60 days', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Ensure user can only create their own blackout dates
  if (user.id !== captainId) {
    return { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' };
  }

  const sanitizedReason = sanitizeReason(reason);

  // Generate all dates in range
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Get existing blackout dates in range to avoid duplicates
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('blackout_dates')
    .select('blackout_date')
    .eq('owner_id', captainId)
    .gte('blackout_date', startDateStr)
    .lte('blackout_date', endDateStr);

  const existingDates = new Set(existing?.map(e => e.blackout_date) || []);
  const newDates = dates.filter(d => !existingDates.has(d));

  if (newDates.length === 0) {
    return { success: false, error: 'All dates in range are already blocked', code: 'DUPLICATE' };
  }

  // Insert all new blackout dates
  const insertData = newDates.map(dateStr => ({
    owner_id: captainId,
    blackout_date: dateStr,
    reason: sanitizedReason,
  }));

  const { data, error } = await supabase
    .from('blackout_dates')
    .insert(insertData)
    .select();

  if (error) {
    console.error('Error creating blackout date range:', error);
    return { success: false, error: 'Failed to create blackout dates', code: 'UNKNOWN' };
  }

  revalidatePath('/dashboard/schedule');
  return { success: true, data: data as BlackoutDate[] };
}

// ============================================================================
// Delete Blackout Date
// ============================================================================

export async function deleteBlackoutDate(
  blackoutId: string
): Promise<ActionResult<void>> {
  // Validate blackoutId
  if (!isValidUUID(blackoutId)) {
    return { success: false, error: 'Invalid blackout ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Verify the blackout belongs to this user before deleting
  const { data: existing, error: fetchError } = await supabase
    .from('blackout_dates')
    .select('owner_id')
    .eq('id', blackoutId)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Blackout date not found', code: 'NOT_FOUND' };
  }

  if (existing.owner_id !== user.id) {
    return { success: false, error: 'Unauthorized access', code: 'UNAUTHORIZED' };
  }

  // Delete the blackout date
  const { error } = await supabase
    .from('blackout_dates')
    .delete()
    .eq('id', blackoutId);

  if (error) {
    console.error('Error deleting blackout date:', error);
    return { success: false, error: 'Failed to delete blackout date', code: 'UNKNOWN' };
  }

  revalidatePath('/dashboard/schedule');
  return { success: true };
}

// ============================================================================
// Convenience Wrapper - Auto-detects user from session
// ============================================================================

export interface CreateBlackoutParams {
  startDate: Date;
  endDate?: Date;
  reason?: string;
}

/**
 * Creates a blackout date or date range, automatically detecting the user from the session.
 * This is a convenience wrapper for createBlackoutDate and createBlackoutDateRange.
 */
export async function createBlackout(params: CreateBlackoutParams): Promise<ActionResult<BlackoutDate | BlackoutDate[]>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  const captainId = user.id;

  // Delegate to the appropriate function
  if (params.endDate) {
    return createBlackoutDateRange(captainId, params.startDate, params.endDate, params.reason);
  } else {
    return createBlackoutDate(captainId, params.startDate, params.reason);
  }
}
