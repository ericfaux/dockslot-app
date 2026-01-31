import { redirect, notFound } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { WaiverTemplateForm } from '../../components/WaiverTemplateForm';

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditWaiverPage({ params }: Props) {
  const { id } = await params;
  const { user, supabase } = await requireAuth()

  const { data: template, error } = await supabase
    .from('waiver_templates')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();

  if (error || !template) {
    notFound();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Edit Waiver Template</h1>
        <p className="mt-1 text-sm text-slate-400">
          Update the liability waiver that passengers must sign
        </p>
      </div>

      <WaiverTemplateForm template={template} />
    </div>
  );
}
