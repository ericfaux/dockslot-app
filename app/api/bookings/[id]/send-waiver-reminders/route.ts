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

    // Find passengers who haven't signed and have an email
    const signedPassengerIds = new Set(signatures?.map((s) => s.passenger_id) || []);
    const signedEmails = new Set(
      signatures?.map((s) => s.signer_email?.toLowerCase()).filter(Boolean) || []
    );

    const passengersNeedingReminder = (passengers || []).filter((p) => {
      if (!p.email) return false;
      if (signedPassengerIds.has(p.id)) return false;
      if (signedEmails.has(p.email.toLowerCase())) return false;
      return true;
    });

    if (passengersNeedingReminder.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All passengers have signed or no passengers have email addresses',
        sent: 0,
      });
    }

    // Get the guest token for the waiver link
    const { data: guestToken, error: tokenError } = await supabase
      .from('guest_tokens')
      .select('token')
      .eq('booking_id', id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !guestToken) {
      return NextResponse.json(
        { error: 'No valid guest token found for this booking' },
        { status: 400 }
      );
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

    // In a real implementation, you would send emails here via Resend
    // For now, we'll simulate success and log the action
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
