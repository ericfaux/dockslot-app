// app/dashboard/payments/page.tsx
// Redirects to Settings > Payments tab
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function PaymentsPage() {
  redirect('/dashboard/settings?tab=payments');
}
