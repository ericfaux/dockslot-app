import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ReferralSettings } from '@/lib/db/types';

/**
 * GET /api/referral-settings
 * Get referral program settings for the authenticated captain
 */
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('referral_settings')
    .select('*')
    .eq('captain_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows returned
    console.error('Error fetching referral settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }

  // If no settings exist, return defaults
  if (!data) {
    return NextResponse.json({
      captain_id: user.id,
      is_enabled: true,
      referrer_reward_type: 'percentage',
      referrer_reward_value: 10,
      referee_reward_type: 'percentage',
      referee_reward_value: 10,
      min_booking_value_cents: 0,
      reward_expiry_days: 90,
      terms_text: null,
    });
  }

  return NextResponse.json(data);
}

/**
 * PUT /api/referral-settings
 * Update or create referral program settings
 */
export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const {
    is_enabled,
    referrer_reward_type,
    referrer_reward_value,
    referee_reward_type,
    referee_reward_value,
    min_booking_value_cents,
    reward_expiry_days,
    terms_text,
  } = body;

  // Validation
  if (typeof is_enabled !== 'boolean') {
    return NextResponse.json({ error: 'is_enabled must be boolean' }, { status: 400 });
  }

  if (!['percentage', 'fixed', 'free_trip'].includes(referrer_reward_type)) {
    return NextResponse.json({ error: 'Invalid referrer_reward_type' }, { status: 400 });
  }

  if (!['percentage', 'fixed', 'free_trip'].includes(referee_reward_type)) {
    return NextResponse.json({ error: 'Invalid referee_reward_type' }, { status: 400 });
  }

  if (
    typeof referrer_reward_value !== 'number' ||
    referrer_reward_value < 0 ||
    (referrer_reward_type === 'percentage' && referrer_reward_value > 100)
  ) {
    return NextResponse.json({ error: 'Invalid referrer_reward_value' }, { status: 400 });
  }

  if (
    typeof referee_reward_value !== 'number' ||
    referee_reward_value < 0 ||
    (referee_reward_type === 'percentage' && referee_reward_value > 100)
  ) {
    return NextResponse.json({ error: 'Invalid referee_reward_value' }, { status: 400 });
  }

  if (
    typeof min_booking_value_cents !== 'number' ||
    min_booking_value_cents < 0
  ) {
    return NextResponse.json(
      { error: 'Invalid min_booking_value_cents' },
      { status: 400 }
    );
  }

  if (
    typeof reward_expiry_days !== 'number' ||
    reward_expiry_days < 1
  ) {
    return NextResponse.json({ error: 'Invalid reward_expiry_days' }, { status: 400 });
  }

  // Upsert settings
  const { data, error } = await supabase
    .from('referral_settings')
    .upsert(
      {
        captain_id: user.id,
        is_enabled,
        referrer_reward_type,
        referrer_reward_value,
        referee_reward_type,
        referee_reward_value,
        min_booking_value_cents,
        reward_expiry_days,
        terms_text: terms_text || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'captain_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error saving referral settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }

  // Log the change
  await supabase.from('audit_logs').insert({
    table_name: 'referral_settings',
    record_id: user.id,
    action: 'update',
    actor_id: user.id,
    new_value: data,
  });

  return NextResponse.json(data);
}
