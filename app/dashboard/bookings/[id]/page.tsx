// app/dashboard/bookings/[id]/page.tsx
// Captain's Logbook - Comprehensive booking detail view
// Design: Maritime Chart Plotter Aesthetic with Dark Theme

export const dynamic = 'force-dynamic';

import { requireAuth } from '@/lib/auth/server';
import { notFound } from 'next/navigation';
import { getBookingById } from '@/lib/data/bookings';
import { BookingDetailClient } from './BookingDetailClient';

interface BookingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = await params;
  const { user } = await requireAuth();

  // Fetch booking to verify ownership
  const booking = await getBookingById(id);

  if (!booking) {
    notFound();
  }

  // Verify user has access (must be the captain)
  if (booking.captain_id !== user.id) {
    notFound();
  }

  return <BookingDetailClient bookingId={id} initialBooking={booking} />;
}
