import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/waivers/[id]/view
 * Get the full signed waiver data for viewing
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: signatureId } = await params;

    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the signature with related data
    const { data: signature, error: signatureError } = await supabase
      .from('waiver_signatures')
      .select(`
        *,
        waiver_template:waiver_templates(
          id,
          title,
          content,
          owner_id,
          version
        ),
        booking:bookings(
          id,
          guest_name,
          scheduled_start,
          captain_id,
          vessel:vessels(name),
          trip_type:trip_types(title)
        ),
        passenger:passengers(
          id,
          full_name,
          email
        )
      `)
      .eq('id', signatureId)
      .single();

    if (signatureError || !signature) {
      return NextResponse.json({ error: 'Waiver signature not found' }, { status: 404 });
    }

    // Verify the captain owns this waiver's booking
    const booking = signature.booking as any;
    if (booking?.captain_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: signature.id,
        signer_name: signature.signer_name,
        signer_email: signature.signer_email,
        signed_at: signature.signed_at,
        ip_address: signature.ip_address,
        signature_data: signature.signature_data,
        template_version: signature.template_version,
        device_info: signature.device_info,
        waiver_template: signature.waiver_template,
        booking: {
          id: booking.id,
          guest_name: booking.guest_name,
          scheduled_start: booking.scheduled_start,
          vessel_name: booking.vessel?.name,
          trip_type: booking.trip_type?.title,
        },
        passenger: signature.passenger,
      },
    });
  } catch (error) {
    console.error('Error fetching waiver:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
