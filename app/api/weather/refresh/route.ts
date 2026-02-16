import { NextRequest, NextResponse } from 'next/server';
import { invalidateWeatherCache } from '@/lib/weather/cache';
import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { enforceFeature } from '@/lib/subscription/enforce';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const gate = await enforceFeature(supabase, user.id, 'weather_alerts');
    if (gate) return gate;

    const { lat, lon } = await request.json();

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid coordinates' }, { status: 400 });
    }

    // Clear both in-memory and Supabase caches for these coordinates
    await invalidateWeatherCache(lat, lon);

    // Also revalidate the Next.js fetch cache for the dashboard
    revalidatePath('/dashboard');

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to refresh weather data' }, { status: 500 });
  }
}
