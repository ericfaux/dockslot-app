import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { ReferralCode } from '@/lib/db/types';

/**
 * GET /api/referral-codes
 * List all referral codes for the authenticated captain
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
    .from('referral_codes')
    .select('*')
    .eq('captain_id', user.id)
    .order('times_used', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching referral codes:', error);
    return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

/**
 * POST /api/referral-codes
 * Create or get a referral code for a guest
 */
export async function POST(request: NextRequest) {
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

  const { guest_email, guest_name } = body;

  if (!guest_email || !guest_email.includes('@')) {
    return NextResponse.json({ error: 'Valid guest_email required' }, { status: 400 });
  }

  if (!guest_name || guest_name.trim().length < 2) {
    return NextResponse.json({ error: 'Valid guest_name required' }, { status: 400 });
  }

  // Check if code already exists for this guest
  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('captain_id', user.id)
    .eq('guest_email', guest_email.toLowerCase())
    .single();

  if (existing) {
    return NextResponse.json(existing);
  }

  // Generate unique code
  const { data: generatedCode, error: genError } = await supabase.rpc(
    'generate_referral_code',
    {
      p_captain_id: user.id,
      p_guest_name: guest_name,
      p_guest_email: guest_email,
    }
  );

  if (genError) {
    console.error('Error generating referral code:', genError);
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 });
  }

  // Create the code
  const { data, error } = await supabase
    .from('referral_codes')
    .insert({
      captain_id: user.id,
      code: generatedCode,
      guest_email: guest_email.toLowerCase(),
      guest_name: guest_name.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating referral code:', error);
    return NextResponse.json({ error: 'Failed to create code' }, { status: 500 });
  }

  // Log the creation
  await supabase.from('audit_logs').insert({
    table_name: 'referral_codes',
    record_id: data.id,
    action: 'create',
    actor_id: user.id,
    new_value: data,
  });

  return NextResponse.json(data);
}
