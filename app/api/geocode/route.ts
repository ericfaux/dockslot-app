import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/geocode?address=ENCODED_ADDRESS
 *
 * Geocodes a US address to lat/lon using the US Census Geocoder API
 * (free, no API key required). Falls back to OpenStreetMap Nominatim
 * if the Census geocoder can't find a match.
 *
 * Returns: { lat, lon, matchedAddress, source }
 */

// US waters bounding box for NOAA coverage
const US_BOUNDS = {
  minLat: 24,
  maxLat: 50,
  minLon: -125,
  maxLon: -66,
};

interface GeocodeResult {
  lat: number;
  lon: number;
  matchedAddress: string;
  source: 'census' | 'nominatim';
}

async function geocodeWithCensus(address: string): Promise<GeocodeResult | null> {
  const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
  url.searchParams.set('address', address);
  url.searchParams.set('benchmark', 'Public_AR_Current');
  url.searchParams.set('format', 'json');

  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const matches = data?.result?.addressMatches;

  if (!matches || matches.length === 0) {
    return null;
  }

  const match = matches[0];
  const lon = match.coordinates.x;
  const lat = match.coordinates.y;

  return {
    lat,
    lon,
    matchedAddress: match.matchedAddress,
    source: 'census',
  };
}

async function geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'us');

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'DockSlot/1.0 (charter booking platform)',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  if (!data || data.length === 0) {
    return null;
  }

  const result = data[0];
  return {
    lat: parseFloat(result.lat),
    lon: parseFloat(result.lon),
    matchedAddress: result.display_name,
    source: 'nominatim',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address || address.trim().length < 5) {
    return NextResponse.json(
      { error: 'Missing or too short address parameter' },
      { status: 400 }
    );
  }

  try {
    // Try Census geocoder first (most accurate for US addresses)
    let result = await geocodeWithCensus(address);

    // Fall back to Nominatim if Census fails
    if (!result) {
      result = await geocodeWithNominatim(address);
    }

    if (!result) {
      return NextResponse.json(
        { error: 'Could not geocode address. Please check the address or enter coordinates manually.' },
        { status: 404 }
      );
    }

    // Validate coordinates are within US waters for NOAA coverage
    const inUSBounds =
      result.lat >= US_BOUNDS.minLat &&
      result.lat <= US_BOUNDS.maxLat &&
      result.lon >= US_BOUNDS.minLon &&
      result.lon <= US_BOUNDS.maxLon;

    if (!inUSBounds) {
      return NextResponse.json(
        {
          error: 'Address is outside NOAA coverage area (US waters only). You can still enter coordinates manually.',
          lat: result.lat,
          lon: result.lon,
          matchedAddress: result.matchedAddress,
          source: result.source,
          outsideCoverage: true,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      lat: result.lat,
      lon: result.lon,
      matchedAddress: result.matchedAddress,
      source: result.source,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { error: 'Geocoding service unavailable. Please try again or enter coordinates manually.' },
      { status: 502 }
    );
  }
}
