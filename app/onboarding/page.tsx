import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import OnboardingWizard from './OnboardingWizard'

export const metadata = {
  title: 'Get Started | DockSlot',
  description: 'Set up your charter business in minutes',
}

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get captain profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Create profile if it doesn't exist
    const { data: newProfile } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        business_name: user.user_metadata?.business_name || null,
        onboarding_step: 0,
        onboarding_completed: false,
      })
      .select()
      .single()

    if (newProfile) {
      return (
        <OnboardingWizard
          profile={newProfile}
          userEmail={user.email || ''}
          userId={user.id}
        />
      )
    }

    // Insert failed — redirect to login
    redirect('/login')
  }

  // If already completed, redirect to dashboard
  if (profile.onboarding_completed) {
    redirect('/dashboard')
  }

  return (
    <OnboardingWizard
      profile={profile}
      userEmail={user.email || ''}
      userId={user.id}
    />
  )
}
