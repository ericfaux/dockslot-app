'use server';

/**
 * Server actions for captain email & SMS notification preferences
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { EmailPreferences } from '@/lib/db/types';

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const DEFAULT_PREFERENCES: Omit<EmailPreferences, 'captain_id' | 'created_at' | 'updated_at'> = {
  booking_confirmation_enabled: true,
  deposit_reminder_enabled: true,
  trip_reminder_enabled: true,
  trip_reminder_timing: ['24h'],
  weather_alert_enabled: true,
  review_request_enabled: true,
  cancellation_notification_enabled: true,
  sms_booking_confirmation: true,
  sms_day_of_reminder: true,
  sms_weather_hold: true,
  custom_what_to_bring: null,
  business_name_override: null,
  business_phone_override: null,
  logo_url: null,
  email_signature: null,
};

export async function getEmailPreferences(): Promise<ActionResult<EmailPreferences>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('captain_id', user.id)
    .single();

  if (error && error.code === 'PGRST116') {
    // No row found — return defaults
    return {
      success: true,
      data: {
        captain_id: user.id,
        ...DEFAULT_PREFERENCES,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  if (error) {
    console.error('Error fetching email preferences:', error);
    return { success: false, error: 'Failed to fetch preferences' };
  }

  return { success: true, data: data as EmailPreferences };
}

export async function updateEmailPreferences(
  params: Partial<Omit<EmailPreferences, 'captain_id' | 'created_at' | 'updated_at'>>
): Promise<ActionResult<EmailPreferences>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' };
  }

  // Validate trip_reminder_timing
  if (params.trip_reminder_timing) {
    const valid = ['24h', '48h'];
    if (!params.trip_reminder_timing.every(t => valid.includes(t))) {
      return { success: false, error: 'Invalid reminder timing values' };
    }
  }

  // Validate logo_url if provided
  if (params.logo_url && params.logo_url.length > 500) {
    return { success: false, error: 'Logo URL too long' };
  }

  // Sanitize text fields
  const updateData: Record<string, unknown> = {};

  const boolFields = [
    'booking_confirmation_enabled',
    'deposit_reminder_enabled',
    'trip_reminder_enabled',
    'weather_alert_enabled',
    'review_request_enabled',
    'cancellation_notification_enabled',
    'sms_booking_confirmation',
    'sms_day_of_reminder',
    'sms_weather_hold',
  ] as const;

  for (const field of boolFields) {
    if (params[field] !== undefined) {
      updateData[field] = Boolean(params[field]);
    }
  }

  if (params.trip_reminder_timing !== undefined) {
    updateData.trip_reminder_timing = params.trip_reminder_timing;
  }

  const textFields = [
    { key: 'custom_what_to_bring' as const, max: 2000 },
    { key: 'business_name_override' as const, max: 200 },
    { key: 'business_phone_override' as const, max: 20 },
    { key: 'logo_url' as const, max: 500 },
    { key: 'email_signature' as const, max: 1000 },
  ];

  for (const { key, max } of textFields) {
    if (params[key] !== undefined) {
      updateData[key] = params[key] ? String(params[key]).trim().slice(0, max) || null : null;
    }
  }

  updateData.updated_at = new Date().toISOString();

  // Upsert — create if not exists, update if exists
  const { data, error } = await supabase
    .from('email_preferences')
    .upsert({
      captain_id: user.id,
      ...DEFAULT_PREFERENCES,
      ...updateData,
    }, {
      onConflict: 'captain_id',
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating email preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }

  return { success: true, data: data as EmailPreferences };
}
