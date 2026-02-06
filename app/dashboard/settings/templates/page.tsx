export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/server';
import { TemplatesClient } from './TemplatesClient'

export default async function MessageTemplatesPage() {
  const { user, supabase } = await requireAuth()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Message Templates</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create reusable templates for common guest messages
        </p>
      </div>

      <TemplatesClient />
    </div>
  )
}
