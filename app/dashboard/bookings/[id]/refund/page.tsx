// app/dashboard/bookings/[id]/refund/page.tsx
// Refund booking page - Issue partial or full refunds
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { redirect, notFound } from 'next/navigation';
import { RefundClient } from './RefundClient';

interface RefundPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RefundPage({ params }: RefundPageProps) {
  const { id } = await params;
  const { user, supabase } = await requireAuth()

  // Fetch booking with payment info
  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      *,
      trip_type:trip_types(
        title,
        duration_hours
      ),
      vessel:vessels(
        name
      )
    `)
    .eq('id', id)
    .eq('profile_id', user.id)
    .single();

  if (error || !booking) {
    notFound();
  }

  // Check if refund is possible
  const canRefund = booking.deposit_paid_cents > 0 || booking.balance_due_cents < booking.total_price_cents;
  
  if (!canRefund) {
    redirect(`/dashboard/schedule?error=no_payment_to_refund`);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section aria-label="Page Header">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
            Issue Refund
          </span>
          <div className="h-px flex-1 bg-slate-800" />
        </div>
        <p className="mt-2 text-sm text-slate-400">
          Process a refund for booking #{booking.id.slice(0, 8)}
        </p>
      </section>

      {/* Refund Client Component */}
      <RefundClient
        bookingId={booking.id}
        guestName={booking.guest_name}
        guestEmail={booking.guest_email}
        tripTitle={booking.trip_type?.title || 'Trip'}
        scheduledDate={booking.scheduled_start}
        totalPriceCents={booking.total_price_cents}
        depositPaidCents={booking.deposit_paid_cents}
        balanceDueCents={booking.balance_due_cents}
        status={booking.status}
      />

      {/* Bottom Accent Bar */}
      <div
        className="mx-auto h-1 w-32 rounded-full"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent)',
        }}
      />
    </div>
  );
}
