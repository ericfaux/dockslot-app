import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canUseFeature, type GatedFeature } from '@/lib/subscription/gates';
import type { SubscriptionTier } from '@/lib/db/types';

export async function enforceFeature(
  supabase: SupabaseClient,
  userId: string,
  feature: GatedFeature
): Promise<NextResponse | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  const tier = (profile?.subscription_tier as SubscriptionTier) ?? 'deckhand';
  if (canUseFeature(tier, feature)) return null;
  return NextResponse.json({ error: 'upgrade_required', feature }, { status: 403 });
}
