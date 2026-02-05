// app/dashboard/waivers/page.tsx
// Redirects to Settings > Waivers tab
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function WaiversPage() {
  redirect('/dashboard/settings?tab=waivers');
}
