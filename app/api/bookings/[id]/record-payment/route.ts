import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getBookingById, logBookingChange } from '@/lib/data/bookings';
import { isValidUUID } from '@/lib/utils/validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/bookings/[id]/record-payment
 * Record a manual payment (e.g., cash) for a booking
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

    // Parse request body
    const body = await request.json();
    const { amount_cents, payment_type, notes } = body;

    if (!amount_cents || typeof amount_cents !== 'number' || amount_cents <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 });
    }

    if (!['deposit', 'balance', 'tip'].includes(payment_type)) {
      return NextResponse.json(
        { error: 'Payment type must be deposit, balance, or tip' },
        { status: 400 }
      );
    }

    // Create payment record
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        booking_id: id,
        amount_cents,
        payment_type,
        status: 'succeeded',
        notes: notes || 'Manual payment recorded',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting payment:', insertError);
      return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 });
    }

    // Update booking payment amounts
    let newDepositPaidCents = booking.deposit_paid_cents;
    let newBalanceDueCents = booking.balance_due_cents;
    let newPaymentStatus = booking.payment_status;

    if (payment_type === 'deposit') {
      newDepositPaidCents += amount_cents;
      newBalanceDueCents = Math.max(0, booking.total_price_cents - newDepositPaidCents);
    } else if (payment_type === 'balance') {
      newBalanceDueCents = Math.max(0, newBalanceDueCents - amount_cents);
    }

    // Update payment status
    if (newBalanceDueCents === 0) {
      newPaymentStatus = 'fully_paid';
    } else if (newDepositPaidCents > 0) {
      newPaymentStatus = 'deposit_paid';
    }

    // Update booking
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        deposit_paid_cents: newDepositPaidCents,
        balance_due_cents: newBalanceDueCents,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
    }

    // Log the change
    await logBookingChange({
      bookingId: id,
      entryType: 'payment_received',
      description: `${payment_type === 'deposit' ? 'Deposit' : payment_type === 'balance' ? 'Balance' : 'Tip'} payment of $${(amount_cents / 100).toFixed(2)} recorded (cash/manual)`,
      newValue: {
        amount_cents,
        payment_type,
        payment_id: payment.id,
      },
      actorType: 'captain',
      actorId: user.id,
    });

    return NextResponse.json({
      payment,
      booking: {
        deposit_paid_cents: newDepositPaidCents,
        balance_due_cents: newBalanceDueCents,
        payment_status: newPaymentStatus,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/bookings/[id]/record-payment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
