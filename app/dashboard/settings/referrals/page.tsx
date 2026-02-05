// app/dashboard/settings/referrals/page.tsx
// Redirects to Settings > Booking Page tab (which contains referrals)
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function ReferralProgramPage() {
  redirect('/dashboard/settings?tab=booking-page');
}
