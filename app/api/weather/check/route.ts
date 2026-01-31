import { NextRequest, NextResponse } from 'next/server';
import { checkMarineConditions, generateWeatherHoldReason } from '@/lib/weather/noaa';

export const runtime = 'edge';

/**
 * GET /api/weather/check?lat=LAT&lon=LON&date=ISO_DATE
 * 
 * Check marine weather conditions for a specific location and date
 * Uses NOAA Marine Weather API (free, no key required)
 * 
 * Returns safety assessment with alerts and forecast
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const dateParam = searchParams.get('date');

    if (!latParam || !lonParam) {
      return NextResponse.json(
        { error: 'Missing lat/lon parameters' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latParam);
    const lon = parseFloat(lonParam);

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { error: 'Invalid lat/lon values' },
        { status: 400 }
      );
    }

    // Validate US waters (NOAA only covers US)
    if (lat < 24 || lat > 50 || lon < -125 || lon > -66) {
      return NextResponse.json(
        { 
          error: 'Location outside NOAA coverage area (US waters only)',
          fallback: true,
        },
        { status: 400 }
      );
    }

    const tripDate = dateParam ? new Date(dateParam) : new Date();

    const conditions = await checkMarineConditions(lat, lon, tripDate);
    const suggestedReason = generateWeatherHoldReason(conditions);

    return NextResponse.json({
      success: true,
      conditions,
      suggestedReason,
      location: { lat, lon },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Weather check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch weather data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
