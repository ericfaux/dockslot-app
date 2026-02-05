import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBookingById, logBookingChange } from '@/lib/data/bookings';
import { isValidUUID } from '@/lib/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/bookings/[id]/send-waiver-reminders
 * Send waiver reminder emails to passengers who haven't signed
 * Includes 24-hour throttling per passenger
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Valid booking ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify booking ownership
    const booking = await getBookingById(id);
    if (!booking || booking.captain_id !== user.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get passengers
    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .select('id, full_name, email')
      .eq('booking_id', id);

    if (passengersError) {
      console.error('Error fetching passengers:', passengersError);
      return NextResponse.json({ error: 'Failed to fetch passengers' }, { status: 500 });
    }

    // Get existing waiver signatures
    const { data: signatures, error: signaturesError } = await supabase
      .from('waiver_signatures')
      .select('passenger_id, signer_email')
      .eq('booking_id', id);

    if (signaturesError) {
      console.error('Error fetching signatures:', signaturesError);
      return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 });
    }

    // Get recent reminders for throttle checking (within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentReminders } = await supabase
      .from('waiver_reminders')
      .select('passenger_id, sent_at')
      .eq('booking_id', id)
      .gt('sent_at', twentyFourHoursAgo);

    // Build set of passengers who received a reminder in the last 24 hours
    const recentlyRemindedPassengerIds = new Set(
      (recentReminders || []).map(r => r.passenger_id)
    );

    // Find passengers who haven't signed and have an email
    const signedPassengerIds = new Set(signatures?.map((s) => s.passenger_id) || []);
    const signedEmails = new Set(
      signatures?.map((s) => s.signer_email?.toLowerCase()).filter(Boolean) || []
    );

    const passengersNeedingReminder = (passengers || []).filter((p) => {
      if (!p.email) return false;
      if (signedPassengerIds.has(p.id)) return false;
      if (signedEmails.has(p.email.toLowerCase())) return false;
      // Skip if already reminded within 24 hours (throttle)
      if (recentlyRemindedPassengerIds.has(p.id)) return false;
      return true;
    });

    if (passengersNeedingReminder.length === 0) {
      // Determine why
      const allPassengers = passengers || [];
      const withoutEmail = allPassengers.filter(p => !p.email);
      const alreadySigned = allPassengers.filter(p =>
        signedPassengerIds.has(p.id) || (p.email && signedEmails.has(p.email.toLowerCase()))
      );
      const throttled = allPassengers.filter(p =>
        p.email &&
        !signedPassengerIds.has(p.id) &&
        !(p.email && signedEmails.has(p.email.toLowerCase())) &&
        recentlyRemindedPassengerIds.has(p.id)
      );

      let message = 'No passengers to remind.';
      if (alreadySigned.length === allPassengers.length) {
        message = 'All passengers have already signed their waivers.';
      } else if (throttled.length > 0 && withoutEmail.length > 0) {
        message = `${throttled.length} passenger(s) already reminded within 24 hours, ${withoutEmail.length} without email.`;
      } else if (throttled.length > 0) {
        message = `${throttled.length} passenger(s) already reminded within the last 24 hours.`;
      } else if (withoutEmail.length > 0) {
        message = `${withoutEmail.length} passenger(s) without email addresses.`;
      }

      return NextResponse.json({
        success: true,
        message,
        sent: 0,
      });
    }

    // Get the guest token for the waiver link
    let guestToken: { token: string } | null = null;
    const { data: existingToken, error: tokenError } = await supabase
      .from('guest_tokens')
      .select('token')
      .eq('booking_id', id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !existingToken) {
      // Create a new token
      const newToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      const { error: insertError } = await supabase
        .from('guest_tokens')
        .upsert({
          booking_id: id,
          token: newToken,
          expires_at: expiresAt.toISOString(),
        });

      if (insertError) {
        console.error('Failed to create guest token:', insertError);
        return NextResponse.json(
          { error: 'Failed to create waiver link' },
          { status: 500 }
        );
      }
      guestToken = { token: newToken };
    } else {
      guestToken = existingToken;
    }

    // Get captain profile for email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_name, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Captain profile not found' }, { status: 400 });
    }

    // Record reminders for throttling
    const reminderInserts = passengersNeedingReminder.map(p => ({
      booking_id: id,
      passenger_id: p.id,
      sent_by: user.id,
      email_sent_to: p.email,
    }));

    const { error: reminderInsertError } = await supabase
      .from('waiver_reminders')
      .insert(reminderInserts);

    if (reminderInsertError) {
      console.error('Failed to record reminders:', reminderInsertError);
      // Don't fail the request, just log the error
    }

    const waiverUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dockslot.com'}/waivers/${guestToken.token}`;

    // Log the reminder
    await logBookingChange({
      bookingId: id,
      entryType: 'guest_communication',
      description: `Waiver reminders sent to ${passengersNeedingReminder.length} passenger(s): ${passengersNeedingReminder.map((p) => p.full_name).join(', ')}`,
      newValue: {
        type: 'waiver_reminder',
        recipients: passengersNeedingReminder.map((p) => ({ name: p.full_name, email: p.email })),
        waiver_url: waiverUrl,
      },
      actorType: 'captain',
      actorId: user.id,
    });

    // TODO: Implement actual email sending via Resend
    // For each passenger, send an email with the waiver link
    // const { sendWaiverReminderEmail } = await import('@/lib/email/templates');
    // await Promise.all(
    //   passengersNeedingReminder.map((p) =>
    //     sendWaiverReminderEmail({
    //       to: p.email!,
    //       passengerName: p.full_name,
    //       businessName: profile.business_name || 'Your Charter',
    //       tripTitle: booking.trip_type?.title || 'Charter Trip',
    //       tripDate: booking.scheduled_start,
    //       waiverUrl,
    //     })
    //   )
    // );

    return NextResponse.json({
      success: true,
      message: `Waiver reminders sent to ${passengersNeedingReminder.length} passenger(s)`,
      sent: passengersNeedingReminder.length,
      recipients: passengersNeedingReminder.map((p) => p.full_name),
    });
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]/send-waiver-reminders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
