import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookingId,
      vesselId,
      departureTime,
      arrivalTime,
      actualPassengers,
      conditionsSummary,
      incidents,
      notes,
      safetyEquipmentChecked,
      fuelUsed,
      hoursOperated,
    } = body;

    // Validate required fields
    if (
      !vesselId ||
      !departureTime ||
      !arrivalTime ||
      !actualPassengers ||
      !conditionsSummary
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate times
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    if (arrival <= departure) {
      return NextResponse.json(
        { error: 'Arrival time must be after departure time' },
        { status: 400 }
      );
    }

    // Create trip report
    const { data: report, error: reportError } = await supabase
      .from('trip_reports')
      .insert({
        captain_id: user.id,
        booking_id: bookingId || null,
        vessel_id: vesselId,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        actual_passengers: actualPassengers,
        conditions_summary: conditionsSummary,
        incidents: incidents || null,
        notes: notes || null,
        safety_equipment_checked: safetyEquipmentChecked || false,
        fuel_used: fuelUsed || null,
        hours_operated: hoursOperated || null,
      })
      .select()
      .single();

    if (reportError) {
      console.error('Failed to create trip report:', reportError);
      return NextResponse.json(
        { error: 'Failed to create trip report' },
        { status: 500 }
      );
    }

    // If linked to booking, update booking status to completed
    if (bookingId) {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          trip_report_id: report.id,
        })
        .eq('id', bookingId)
        .eq('captain_id', user.id);

      if (updateError) {
        console.error('Failed to update booking status:', updateError);
        // Don't fail the trip report creation, just log it
      } else {
        // Add booking log entry only if update succeeded
        const { error: logError } = await supabase.from('booking_logs').insert({
          booking_id: bookingId,
          actor_type: 'captain',
          actor_id: user.id,
          entry_type: 'trip_completed',
          description: 'Trip completed and report filed',
          old_value: { status: 'confirmed' },
          new_value: { 
            status: 'completed',
            report_id: report.id,
            conditions: conditionsSummary,
            has_incidents: !!incidents,
          },
        });

        if (logError) {
          console.error('Failed to create booking log:', logError);
          // Don't fail the trip report, just log it
        }
      }
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Trip report creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create trip report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: reports, error } = await supabase
      .from('trip_reports')
      .select(`
        id,
        created_at,
        departure_time,
        arrival_time,
        actual_passengers,
        conditions_summary,
        incidents,
        notes,
        booking:bookings(
          id,
          guest_name,
          trip_type:trip_types(title),
          vessel:vessels(name)
        )
      `)
      .eq('captain_id', user.id)
      .order('departure_time', { ascending: false });

    if (error) {
      console.error('Failed to fetch trip reports:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trip reports' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Trip reports fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trip reports' },
      { status: 500 }
    );
  }
}
