import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/referral-codes/[id]
 * Toggle referral code active status
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify ownership
  const { data: code, error: fetchError } = await supabase
    .from('referral_codes')
    .select('id, captain_id, is_active')
    .eq('id', id)
    .single();

  if (fetchError || !code) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 });
  }

  if (code.captain_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Toggle
  const { data, error } = await supabase
    .from('referral_codes')
    .update({
      is_active: !code.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating referral code:', error);
    return NextResponse.json({ error: 'Failed to update code' }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/referral-codes/[id]
 * Delete a referral code (only if never used)
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const supabase = await createSupabaseServerClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Verify ownership
  const { data: code, error: fetchError } = await supabase
    .from('referral_codes')
    .select('id, captain_id, times_used')
    .eq('id', id)
    .single();

  if (fetchError || !code) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 });
  }

  if (code.captain_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  if (code.times_used > 0) {
    return NextResponse.json(
      { error: 'Cannot delete code that has been used. Deactivate it instead.' },
      { status: 400 }
    );
  }

  // Delete
  const { error } = await supabase.from('referral_codes').delete().eq('id', id);

  if (error) {
    console.error('Error deleting referral code:', error);
    return NextResponse.json({ error: 'Failed to delete code' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
