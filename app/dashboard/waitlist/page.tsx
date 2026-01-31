import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import WaitlistClient from './WaitlistClient';

export default async function WaitlistPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <WaitlistClient />;
}
