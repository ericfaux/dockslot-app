import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { WaitlistStatus } from '@/lib/db/types';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/waitlist/[id]
 * Update waitlist entry status (captain only)
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status, notified_for_booking_id, converted_to_booking_id } = body;

  // Verify ownership
  const { data: entry, error: fetchError } = await supabase
    .from('waitlist_entries')
    .select('captain_id, status')
    .eq('id', id)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  if (entry.captain_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Prepare update
  const updates: any = {
    updated_at: new Date().toISOString(),
  };

  if (status && ['active', 'notified', 'converted', 'cancelled', 'expired'].includes(status)) {
    updates.status = status;

    if (status === 'notified') {
      updates.notified_at = new Date().toISOString();
      if (notified_for_booking_id) {
        updates.notified_for_booking_id = notified_for_booking_id;
      }
    }

    if (status === 'converted' && converted_to_booking_id) {
      updates.converted_to_booking_id = converted_to_booking_id;
    }
  }

  // Update
  const { data, error } = await supabase
    .from('waitlist_entries')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating waitlist entry:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }

  // Log update
  await supabase.from('audit_logs').insert({
    table_name: 'waitlist_entries',
    record_id: id,
    action: 'update',
    actor_id: user.id,
    old_value: { status: entry.status },
    new_value: { status: data.status },
  });

  return NextResponse.json(data);
}

/**
 * DELETE /api/waitlist/[id]
 * Delete/cancel waitlist entry
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
  const { data: entry, error: fetchError } = await supabase
    .from('waitlist_entries')
    .select('captain_id')
    .eq('id', id)
    .single();

  if (fetchError || !entry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
  }

  if (entry.captain_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Delete
  const { error } = await supabase.from('waitlist_entries').delete().eq('id', id);

  if (error) {
    console.error('Error deleting waitlist entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }

  // Log deletion
  await supabase.from('audit_logs').insert({
    table_name: 'waitlist_entries',
    record_id: id,
    action: 'delete',
    actor_id: user.id,
  });

  return NextResponse.json({ success: true });
}
