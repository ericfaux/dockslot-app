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
  meeting_spot_latitude?: number | null;
  meeting_spot_longitude?: number | null;
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
  season_revenue_goal_cents?: number;
  venmo_username?: string | null;
  zelle_contact?: string | null;
  venmo_enabled?: boolean;
  venmo_payment_instructions?: string | null;
  zelle_enabled?: boolean;
  zelle_payment_instructions?: string | null;
  auto_confirm_manual_payments?: boolean;
  hero_image_url?: string | null;
  booking_tagline?: string | null;
  brand_accent_color?: string | null;
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

  // Meeting spot coordinates
  if (params.meeting_spot_latitude !== undefined) {
    if (params.meeting_spot_latitude !== null) {
      if (typeof params.meeting_spot_latitude !== 'number' || isNaN(params.meeting_spot_latitude)) {
        return { success: false, error: 'Invalid latitude value', code: 'VALIDATION' };
      }
      if (params.meeting_spot_latitude < -90 || params.meeting_spot_latitude > 90) {
        return { success: false, error: 'Latitude must be between -90 and 90', code: 'VALIDATION' };
      }
    }
    updateData.meeting_spot_latitude = params.meeting_spot_latitude;
  }

  if (params.meeting_spot_longitude !== undefined) {
    if (params.meeting_spot_longitude !== null) {
      if (typeof params.meeting_spot_longitude !== 'number' || isNaN(params.meeting_spot_longitude)) {
        return { success: false, error: 'Invalid longitude value', code: 'VALIDATION' };
      }
      if (params.meeting_spot_longitude < -180 || params.meeting_spot_longitude > 180) {
        return { success: false, error: 'Longitude must be between -180 and 180', code: 'VALIDATION' };
      }
    }
    updateData.meeting_spot_longitude = params.meeting_spot_longitude;
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

  // Season revenue goal
  if (params.season_revenue_goal_cents !== undefined) {
    if (typeof params.season_revenue_goal_cents !== 'number' || params.season_revenue_goal_cents < 0) {
      return { success: false, error: 'Revenue goal must be a non-negative number', code: 'VALIDATION' };
    }
    updateData.season_revenue_goal_cents = Math.floor(params.season_revenue_goal_cents);
  }

  // Venmo username
  if (params.venmo_username !== undefined) {
    updateData.venmo_username = sanitizeText(params.venmo_username, 100);
  }

  // Zelle contact
  if (params.zelle_contact !== undefined) {
    updateData.zelle_contact = sanitizeText(params.zelle_contact, 200);
  }

  // Venmo enabled
  if (params.venmo_enabled !== undefined) {
    updateData.venmo_enabled = Boolean(params.venmo_enabled);
  }

  // Venmo payment instructions
  if (params.venmo_payment_instructions !== undefined) {
    updateData.venmo_payment_instructions = sanitizeText(params.venmo_payment_instructions, 500);
  }

  // Zelle enabled
  if (params.zelle_enabled !== undefined) {
    updateData.zelle_enabled = Boolean(params.zelle_enabled);
  }

  // Zelle payment instructions
  if (params.zelle_payment_instructions !== undefined) {
    updateData.zelle_payment_instructions = sanitizeText(params.zelle_payment_instructions, 500);
  }

  // Auto-confirm alternative payments
  if (params.auto_confirm_manual_payments !== undefined) {
    updateData.auto_confirm_manual_payments = Boolean(params.auto_confirm_manual_payments);
  }

  // Hero image URL
  if (params.hero_image_url !== undefined) {
    updateData.hero_image_url = sanitizeText(params.hero_image_url, 2000);
  }

  // Booking tagline
  if (params.booking_tagline !== undefined) {
    updateData.booking_tagline = sanitizeText(params.booking_tagline, 200);
  }

  // Brand accent color
  if (params.brand_accent_color !== undefined) {
    if (params.brand_accent_color) {
      const hexRegex = /^#[0-9a-fA-F]{6}$/;
      if (!hexRegex.test(params.brand_accent_color)) {
        return { success: false, error: 'Invalid accent color format (must be #RRGGBB)', code: 'VALIDATION' };
      }
      updateData.brand_accent_color = params.brand_accent_color;
    } else {
      updateData.brand_accent_color = '#0891b2';
    }
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
