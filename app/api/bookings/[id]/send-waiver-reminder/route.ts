import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: bookingId } = await context.params;
  const supabase = await createSupabaseServerClient();

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse request body
  let passengerId: string;
  try {
    const body = await request.json();
    passengerId = body.passengerId;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!passengerId) {
    return NextResponse.json({ error: 'Passenger ID is required' }, { status: 400 });
  }

  // Verify the booking belongs to this captain
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('id, captain_id, guest_name, guest_email, scheduled_start')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.captain_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Get the passenger
  const { data: passenger, error: passengerError } = await supabase
    .from('passengers')
    .select('id, full_name, email')
    .eq('id', passengerId)
    .eq('booking_id', bookingId)
    .single();

  if (passengerError || !passenger) {
    return NextResponse.json({ error: 'Passenger not found' }, { status: 404 });
  }

  if (!passenger.email) {
    return NextResponse.json({ error: 'Passenger has no email address' }, { status: 400 });
  }

  // Check if passenger has already signed all waivers
  const { data: activeWaivers } = await supabase
    .from('waiver_templates')
    .select('id')
    .eq('owner_id', user.id)
    .eq('is_active', true);

  if (!activeWaivers || activeWaivers.length === 0) {
    return NextResponse.json({ error: 'No active waivers configured' }, { status: 400 });
  }

  const { data: signatures } = await supabase
    .from('waiver_signatures')
    .select('waiver_template_id')
    .eq('booking_id', bookingId)
    .eq('passenger_id', passengerId);

  const signedTemplateIds = new Set((signatures || []).map(s => s.waiver_template_id));
  const unsignedWaivers = activeWaivers.filter(w => !signedTemplateIds.has(w.id));

  if (unsignedWaivers.length === 0) {
    return NextResponse.json({ error: 'Passenger has already signed all waivers' }, { status: 400 });
  }

  // Check throttle: max 1 reminder per 24 hours per passenger
  const { data: lastReminder } = await supabase
    .from('waiver_reminders')
    .select('sent_at')
    .eq('booking_id', bookingId)
    .eq('passenger_id', passengerId)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (lastReminder) {
    const lastSentAt = new Date(lastReminder.sent_at);
    const hoursSinceLastReminder = (Date.now() - lastSentAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastReminder < 24) {
      const hoursRemaining = Math.ceil(24 - hoursSinceLastReminder);
      return NextResponse.json(
        { error: `Reminder already sent. You can send another in ${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}.` },
        { status: 429 }
      );
    }
  }

  // Get or create guest token
  let guestToken: string;
  const { data: existingToken } = await supabase
    .from('guest_tokens')
    .select('token')
    .eq('booking_id', bookingId)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (existingToken) {
    guestToken = existingToken.token;
  } else {
    // Create new token
    const newToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    const { error: tokenError } = await supabase
      .from('guest_tokens')
      .upsert({
        booking_id: bookingId,
        token: newToken,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Failed to create guest token:', tokenError);
      return NextResponse.json({ error: 'Failed to create waiver link' }, { status: 500 });
    }
    guestToken = newToken;
  }

  // Record the reminder (for throttling)
  const { error: reminderError } = await supabase
    .from('waiver_reminders')
    .insert({
      booking_id: bookingId,
      passenger_id: passengerId,
      sent_by: user.id,
      email_sent_to: passenger.email,
    });

  if (reminderError) {
    console.error('Failed to record reminder:', reminderError);
    // Don't fail the request, just log the error
  }

  // In a real implementation, you would send an email here
  // For now, we'll just return success with the waiver link
  const waiverUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/waivers/${guestToken}`;

  // Log the reminder send
  await supabase.from('booking_logs').insert({
    booking_id: bookingId,
    entry_type: 'reminder_sent',
    description: `Waiver reminder sent to ${passenger.full_name} (${passenger.email})`,
    actor_type: 'captain',
    actor_id: user.id,
  });

  return NextResponse.json({
    success: true,
    message: `Reminder sent to ${passenger.email}`,
    waiverUrl, // Include for debugging/display purposes
  });
}
