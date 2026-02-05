import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBookingById, getBookingLogs } from '@/lib/data/bookings';
import { isValidUUID } from '@/lib/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/bookings/[id]/details
 *
 * Retrieves comprehensive booking details including:
 * - Booking with vessel and trip type
 * - Passengers
 * - Waiver signatures with template info
 * - Payment records
 * - Booking logs (activity timeline)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    if (!id || !isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Valid booking ID is required' },
        { status: 400 }
      );
    }

    // Authenticate
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch booking with details
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify user has access (must be the captain)
    if (booking.captain_id !== user.id) {
      return NextResponse.json(
        { error: 'Access denied to this booking' },
        { status: 403 }
      );
    }

    // Fetch passengers
    const { data: passengers, error: passengersError } = await supabase
      .from('passengers')
      .select('*')
      .eq('booking_id', id)
      .order('is_primary_contact', { ascending: false })
      .order('created_at', { ascending: true });

    if (passengersError) {
      console.error('Error fetching passengers:', passengersError);
    }

    // Fetch waiver signatures with template info
    const { data: waiverSignatures, error: waiversError } = await supabase
      .from('waiver_signatures')
      .select(`
        *,
        waiver_template:waiver_templates(
          id,
          title,
          version
        )
      `)
      .eq('booking_id', id)
      .order('signed_at', { ascending: false });

    if (waiversError) {
      console.error('Error fetching waiver signatures:', waiversError);
    }

    // Fetch active waiver template for the captain
    const { data: activeWaiverTemplate, error: templateError } = await supabase
      .from('waiver_templates')
      .select('id, title, version')
      .eq('owner_id', user.id)
      .eq('is_active', true)
      .single();

    if (templateError && templateError.code !== 'PGRST116') {
      console.error('Error fetching waiver template:', templateError);
    }

    // Fetch payment records
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: true });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
    }

    // Fetch booking logs (activity timeline)
    const logs = await getBookingLogs(id);

    // Fetch audit logs for additional timeline events
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('table_name', 'bookings')
      .eq('record_id', id)
      .order('created_at', { ascending: false });

    if (auditError) {
      console.error('Error fetching audit logs:', auditError);
    }

    // Fetch guest token for this booking (for sending waiver links)
    const { data: guestToken, error: tokenError } = await supabase
      .from('guest_tokens')
      .select('token, expires_at')
      .eq('booking_id', id)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError && tokenError.code !== 'PGRST116') {
      console.error('Error fetching guest token:', tokenError);
    }

    return NextResponse.json({
      booking,
      passengers: passengers || [],
      waiverSignatures: waiverSignatures || [],
      activeWaiverTemplate: activeWaiverTemplate || null,
      payments: payments || [],
      logs,
      auditLogs: auditLogs || [],
      guestToken: guestToken || null,
    });
  } catch (error) {
    console.error('Error in GET /api/bookings/[id]/details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
