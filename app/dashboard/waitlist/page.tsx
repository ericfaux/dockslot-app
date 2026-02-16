import { requireAuth } from '@/lib/auth/server';
import WaitlistClient from './WaitlistClient';
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay';
import type { SubscriptionTier } from '@/lib/db/types';

export default async function WaitlistPage() {
  const { user, supabase } = await requireAuth();

  // Fetch subscription tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const subscriptionTier = (profile?.subscription_tier ?? 'deckhand') as SubscriptionTier;
  const isDeckhand = subscriptionTier === 'deckhand';

  const content = <WaitlistClient />;

  if (isDeckhand) {
    return (
      <LockedFeatureOverlay feature="waitlist" pattern="section">
        {content}
      </LockedFeatureOverlay>
    );
  }

  return content;
}
