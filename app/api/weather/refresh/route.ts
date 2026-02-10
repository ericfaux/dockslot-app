import { NextRequest, NextResponse } from 'next/server';
import { invalidateWeatherCache } from '@/lib/weather/cache';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
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
