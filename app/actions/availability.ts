'use server';

/**
 * DockSlot Availability Server Actions
 * Handles CRUD operations for availability windows
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { AvailabilityWindow } from '@/lib/db/types';

// ============================================================================
// Types
// ============================================================================

export type AvailabilityErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: AvailabilityErrorCode;
}

export interface AvailabilityWindowInput {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ============================================================================
// Validation Helpers
// ============================================================================

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function isValidTime(time: string): boolean {
  // Accept HH:MM or HH:MM:SS format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return timeRegex.test(time);
}

function normalizeTime(time: string): string {
  // Ensure time is in HH:MM:SS format
  if (time.length === 5) {
    return `${time}:00`;
  }
  return time;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function validateTimeRange(startTime: string, endTime: string): string | null {
  if (!isValidTime(startTime)) {
    return 'Invalid start time format';
  }
  if (!isValidTime(endTime)) {
    return 'Invalid end time format';
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    return 'End time must be after start time';
  }

  return null;
}

function validateDayOfWeek(day: number): boolean {
  return Number.isInteger(day) && day >= 0 && day <= 6;
}

// ============================================================================
// Get Availability Windows
// ============================================================================

export async function getAvailabilityWindows(): Promise<ActionResult<AvailabilityWindow[]>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Fetch availability windows for the captain
  const { data, error } = await supabase
    .from('availability_windows')
    .select('*')
    .eq('owner_id', user.id)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching availability windows:', error);
    return { success: false, error: 'Failed to fetch availability windows', code: 'UNKNOWN' };
  }

  return { success: true, data: data as AvailabilityWindow[] };
}

// ============================================================================
// Upsert Availability Windows
// ============================================================================

export async function upsertAvailabilityWindows(
  windows: AvailabilityWindowInput[]
): Promise<ActionResult<AvailabilityWindow[]>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Validate we have exactly 7 windows (one per day)
  if (!Array.isArray(windows) || windows.length !== 7) {
    return {
      success: false,
      error: 'Must provide availability for all 7 days of the week',
      code: 'VALIDATION'
    };
  }

  // Validate each window
  const seenDays = new Set<number>();
  for (const window of windows) {
    // Validate day_of_week
    if (!validateDayOfWeek(window.day_of_week)) {
      return {
        success: false,
        error: `Invalid day of week: ${window.day_of_week}`,
        code: 'VALIDATION'
      };
    }

    // Check for duplicate days
    if (seenDays.has(window.day_of_week)) {
      return {
        success: false,
        error: `Duplicate entry for ${DAY_NAMES[window.day_of_week]}`,
        code: 'VALIDATION'
      };
    }
    seenDays.add(window.day_of_week);

    // Validate time range (only if the day is active)
    if (window.is_active) {
      const timeError = validateTimeRange(window.start_time, window.end_time);
      if (timeError) {
        return {
          success: false,
          error: `${DAY_NAMES[window.day_of_week]}: ${timeError}`,
          code: 'VALIDATION'
        };
      }
    }

    // Validate ID if provided
    if (window.id && !isValidUUID(window.id)) {
      return {
        success: false,
        error: 'Invalid window ID',
        code: 'VALIDATION'
      };
    }
  }

  // Prepare upsert data
  const upsertData = windows.map(window => ({
    ...(window.id ? { id: window.id } : {}),
    owner_id: user.id,
    day_of_week: window.day_of_week,
    start_time: normalizeTime(window.start_time),
    end_time: normalizeTime(window.end_time),
    is_active: window.is_active,
  }));

  // Upsert all windows in a single operation
  // Using on conflict (owner_id, day_of_week) to update existing or insert new
  const { data, error } = await supabase
    .from('availability_windows')
    .upsert(upsertData, {
      onConflict: 'owner_id,day_of_week',
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    console.error('Error upserting availability windows:', error);
    return { success: false, error: 'Failed to save availability windows', code: 'UNKNOWN' };
  }

  return { success: true, data: data as AvailabilityWindow[] };
}

// ============================================================================
// Create Default Availability
// ============================================================================

/**
 * Default availability configuration for new captains
 * - All days active except Monday (common off day)
 * - Start time: 06:00:00
 * - End time: 21:00:00
 */
const DEFAULT_AVAILABILITY_CONFIG = {
  start_time: '06:00:00',
  end_time: '21:00:00',
  // Sunday=0, Monday=1, ..., Saturday=6
  // Monday is off by default (common off day for charter operations)
  activeDays: [0, 2, 3, 4, 5, 6], // Sunday, Tuesday-Saturday active
};

/**
 * Creates default availability windows for a captain.
 * Creates 7 rows (one per day of the week) with reasonable defaults:
 * - All days active except Monday
 * - Hours: 06:00 AM to 09:00 PM
 *
 * This function is idempotent - it will not create duplicate rows.
 * Uses upsert with onConflict to handle existing entries.
 *
 * @param captainId - The captain's user ID
 * @returns ActionResult indicating success or failure
 */
export async function createDefaultAvailability(
  captainId: string
): Promise<ActionResult<AvailabilityWindow[]>> {
  const supabase = await createSupabaseServerClient();

  // Validate captain ID format
  if (!isValidUUID(captainId)) {
    return {
      success: false,
      error: 'Invalid captain ID format',
      code: 'VALIDATION',
    };
  }

  // Build the default availability data for all 7 days
  const defaultWindows = Array.from({ length: 7 }, (_, dayOfWeek) => ({
    owner_id: captainId,
    day_of_week: dayOfWeek,
    start_time: DEFAULT_AVAILABILITY_CONFIG.start_time,
    end_time: DEFAULT_AVAILABILITY_CONFIG.end_time,
    is_active: DEFAULT_AVAILABILITY_CONFIG.activeDays.includes(dayOfWeek),
  }));

  // Upsert all 7 windows
  // Using onConflict to avoid duplicates if called multiple times
  const { data, error } = await supabase
    .from('availability_windows')
    .upsert(defaultWindows, {
      onConflict: 'owner_id,day_of_week',
      ignoreDuplicates: true, // Don't update if already exists
    })
    .select();

  if (error) {
    console.error('Error creating default availability:', error);
    return {
      success: false,
      error: 'Failed to create default availability windows',
      code: 'UNKNOWN',
    };
  }

  return { success: true, data: data as AvailabilityWindow[] };
}

/**
 * Checks if a captain has any availability windows configured.
 *
 * @param captainId - The captain's user ID
 * @returns ActionResult with boolean indicating if availability exists
 */
export async function hasAvailabilityWindows(
  captainId: string
): Promise<ActionResult<boolean>> {
  const supabase = await createSupabaseServerClient();

  if (!isValidUUID(captainId)) {
    return {
      success: false,
      error: 'Invalid captain ID format',
      code: 'VALIDATION',
    };
  }

  const { count, error } = await supabase
    .from('availability_windows')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', captainId);

  if (error) {
    console.error('Error checking availability windows:', error);
    return {
      success: false,
      error: 'Failed to check availability windows',
      code: 'UNKNOWN',
    };
  }

  return { success: true, data: (count ?? 0) > 0 };
}

/**
 * Ensures a captain has availability windows.
 * If none exist, creates default windows.
 * Used during auth callback or dashboard load.
 *
 * @param captainId - The captain's user ID
 * @returns ActionResult indicating if defaults were created
 */
export async function ensureAvailabilityExists(
  captainId: string
): Promise<ActionResult<{ created: boolean }>> {
  // Check if availability already exists
  const hasWindowsResult = await hasAvailabilityWindows(captainId);

  if (!hasWindowsResult.success) {
    return {
      success: false,
      error: hasWindowsResult.error,
      code: hasWindowsResult.code,
    };
  }

  // If windows already exist, nothing to do
  if (hasWindowsResult.data) {
    return { success: true, data: { created: false } };
  }

  // Create default availability
  const createResult = await createDefaultAvailability(captainId);

  if (!createResult.success) {
    return {
      success: false,
      error: createResult.error,
      code: createResult.code,
    };
  }

  return { success: true, data: { created: true } };
}

