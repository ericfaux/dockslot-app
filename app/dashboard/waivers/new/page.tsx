import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { WaiverTemplateForm } from '../components/WaiverTemplateForm';

export default async function NewWaiverPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Create Waiver Template</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create a liability waiver that passengers must sign before their trip
        </p>
      </div>

      <WaiverTemplateForm />
    </div>
  );
}
