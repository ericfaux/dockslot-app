export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/utils/supabase/server'
import { TemplatesClient } from './TemplatesClient'

export default async function MessageTemplatesPage() {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Message Templates</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create reusable templates for common guest messages
        </p>
      </div>

      <TemplatesClient />
    </div>
  )
}
