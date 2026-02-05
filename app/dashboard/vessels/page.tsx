// app/dashboard/vessels/page.tsx
// Redirects to Settings > Vessels tab
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function VesselsPage() {
  redirect('/dashboard/settings?tab=vessels');
}
