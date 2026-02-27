import { requireAuth } from '@/lib/auth/server';
import WaitlistClient from './WaitlistClient';

export default async function WaitlistPage() {
  const { user, supabase } = await requireAuth();

  return <WaitlistClient />;
}
