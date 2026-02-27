import { requireAuth } from '@/lib/auth/server';
import { NewWaiverFlow } from '../components/NewWaiverFlow';

export default async function NewWaiverPage() {
  await requireAuth();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Waiver Template</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create a liability waiver that passengers must sign before their trip
        </p>
      </div>

      <NewWaiverFlow />
    </div>
  );
}
