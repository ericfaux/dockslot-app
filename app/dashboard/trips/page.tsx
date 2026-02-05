// app/dashboard/trips/page.tsx
// Redirects to Settings > Trip Types tab
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function TripsPage() {
  redirect('/dashboard/settings?tab=trip-types');
}
