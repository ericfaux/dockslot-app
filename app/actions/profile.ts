'use server';

/**
 * DockSlot Profile Server Actions
 * Handles CRUD operations for captain profile/settings
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Profile } from '@/lib/db/types';

// ============================================================================
// Types
// ============================================================================

export type ProfileErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'UNKNOWN';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ProfileErrorCode;
}

export interface UpdateProfileParams {
  full_name?: string | null;
  business_name?: string | null;
  email?: string | null;
  phone?: string | null;
  timezone?: string;
  meeting_spot_name?: string | null;
  meeting_spot_address?: string | null;
  meeting_spot_instructions?: string | null;
  booking_buffer_minutes?: number;
  advance_booking_days?: number;
  is_hibernating?: boolean;
  hibernation_message?: string | null;
  hibernation_end_date?: string | null;
  hibernation_resume_time?: string | null;
  hibernation_show_return_date?: boolean;
  hibernation_allow_notifications?: boolean;
  hibernation_show_contact_info?: boolean;
  cancellation_policy?: string | null;
  dock_mode_enabled?: boolean;
}

// ============================================================================
// Validation Helpers
// ============================================================================

function sanitizeText(text: string | undefined | null, maxLength: number = 500): string | null {
  if (!text) return null;
  return text.trim().slice(0, maxLength);
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // Allow digits, spaces, dashes, parentheses, and plus sign
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
}

// Common timezones for validation
const VALID_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Phoenix',
  'America/Detroit',
  'America/Indianapolis',
  'America/Kentucky/Louisville',
  'America/Boise',
  'America/Juneau',
  'America/Nome',
  'America/Sitka',
  'America/Yakutat',
  'Pacific/Guam',
  'Pacific/Pago_Pago',
  'America/Puerto_Rico',
  'Atlantic/Bermuda',
  'America/Virgin',
  'Pacific/Majuro',
  'Pacific/Palau',
  'UTC',
];

function isValidTimezone(tz: string): boolean {
  // Accept any IANA timezone string
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Get Profile
// ============================================================================

export async function getProfile(): Promise<ActionResult<Profile>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Fetch profile for the user
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return { success: false, error: 'Failed to fetch profile', code: 'NOT_FOUND' };
  }

  return { success: true, data: data as Profile };
}

// ============================================================================
// Update Profile
// ============================================================================

export async function updateProfile(
  params: UpdateProfileParams
): Promise<ActionResult<Profile>> {
  const supabase = await createSupabaseServerClient();

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'UNAUTHORIZED' };
  }

  // Build update object with validation
  const updateData: Record<string, unknown> = {};

  // Full name
  if (params.full_name !== undefined) {
    updateData.full_name = sanitizeText(params.full_name, 100);
  }

  // Business name
  if (params.business_name !== undefined) {
    updateData.business_name = sanitizeText(params.business_name, 200);
  }

  // Email validation
  if (params.email !== undefined) {
    if (params.email && !isValidEmail(params.email)) {
      return { success: false, error: 'Invalid email address', code: 'VALIDATION' };
    }
    updateData.email = sanitizeText(params.email, 254);
  }

  // Phone validation
  if (params.phone !== undefined) {
    if (params.phone && !isValidPhone(params.phone)) {
      return { success: false, error: 'Invalid phone number', code: 'VALIDATION' };
    }
    updateData.phone = sanitizeText(params.phone, 20);
  }

  // Timezone validation
  if (params.timezone !== undefined) {
    if (!isValidTimezone(params.timezone)) {
      return { success: false, error: 'Invalid timezone', code: 'VALIDATION' };
    }
    updateData.timezone = params.timezone;
  }

  // Meeting spot details
  if (params.meeting_spot_name !== undefined) {
    updateData.meeting_spot_name = sanitizeText(params.meeting_spot_name, 100);
  }

  if (params.meeting_spot_address !== undefined) {
    updateData.meeting_spot_address = sanitizeText(params.meeting_spot_address, 500);
  }

  if (params.meeting_spot_instructions !== undefined) {
    updateData.meeting_spot_instructions = sanitizeText(params.meeting_spot_instructions, 1000);
  }

  // Booking buffer minutes
  if (params.booking_buffer_minutes !== undefined) {
    if (typeof params.booking_buffer_minutes !== 'number' || params.booking_buffer_minutes < 0) {
      return { success: false, error: 'Booking buffer must be a non-negative number', code: 'VALIDATION' };
    }
    if (params.booking_buffer_minutes > 1440) {
      return { success: false, error: 'Booking buffer cannot exceed 24 hours (1440 minutes)', code: 'VALIDATION' };
    }
    updateData.booking_buffer_minutes = Math.floor(params.booking_buffer_minutes);
  }

  // Advance booking days
  if (params.advance_booking_days !== undefined) {
    if (typeof params.advance_booking_days !== 'number' || params.advance_booking_days < 1) {
      return { success: false, error: 'Advance booking days must be at least 1', code: 'VALIDATION' };
    }
    if (params.advance_booking_days > 365) {
      return { success: false, error: 'Advance booking days cannot exceed 365', code: 'VALIDATION' };
    }
    updateData.advance_booking_days = Math.floor(params.advance_booking_days);
  }

  // Hibernation mode
  if (params.is_hibernating !== undefined) {
    updateData.is_hibernating = Boolean(params.is_hibernating);
  }

  if (params.hibernation_message !== undefined) {
    updateData.hibernation_message = sanitizeText(params.hibernation_message, 500);
  }

  // Hibernation end date validation (YYYY-MM-DD format)
  if (params.hibernation_end_date !== undefined) {
    if (params.hibernation_end_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(params.hibernation_end_date)) {
        return { success: false, error: 'Invalid hibernation end date format', code: 'VALIDATION' };
      }
      // Validate it's a real date
      const date = new Date(params.hibernation_end_date);
      if (isNaN(date.getTime())) {
        return { success: false, error: 'Invalid hibernation end date', code: 'VALIDATION' };
      }
      updateData.hibernation_end_date = params.hibernation_end_date;
    } else {
      updateData.hibernation_end_date = null;
    }
  }

  // Hibernation resume time validation (HH:MM format)
  if (params.hibernation_resume_time !== undefined) {
    if (params.hibernation_resume_time) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(params.hibernation_resume_time)) {
        return { success: false, error: 'Invalid hibernation resume time format', code: 'VALIDATION' };
      }
      updateData.hibernation_resume_time = params.hibernation_resume_time;
    } else {
      updateData.hibernation_resume_time = null;
    }
  }

  // Hibernation display preferences
  if (params.hibernation_show_return_date !== undefined) {
    updateData.hibernation_show_return_date = Boolean(params.hibernation_show_return_date);
  }

  if (params.hibernation_allow_notifications !== undefined) {
    updateData.hibernation_allow_notifications = Boolean(params.hibernation_allow_notifications);
  }

  if (params.hibernation_show_contact_info !== undefined) {
    updateData.hibernation_show_contact_info = Boolean(params.hibernation_show_contact_info);
  }

  // Cancellation policy
  if (params.cancellation_policy !== undefined) {
    updateData.cancellation_policy = sanitizeText(params.cancellation_policy, 2000);
  }

  // Dock mode
  if (params.dock_mode_enabled !== undefined) {
    updateData.dock_mode_enabled = Boolean(params.dock_mode_enabled);
  }

  if (Object.keys(updateData).length === 0) {
    return { success: false, error: 'No valid updates provided', code: 'VALIDATION' };
  }

  // Add updated_at timestamp
  updateData.updated_at = new Date().toISOString();

  // Update the profile
  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile', code: 'UNKNOWN' };
  }

  return { success: true, data: data as Profile };
}
