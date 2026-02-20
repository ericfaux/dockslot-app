import { NextRequest, NextResponse } from 'next/server';
import {
  resolveCaptainId,
  getPublicCaptainProfile,
  getPublicTripTypes,
} from '@/app/actions/public-booking';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ captainId: string }> }
) {
  const { captainId: rawId } = await params;

  // Resolve slug or UUID to captain ID
  const resolveResult = await resolveCaptainId(rawId);
  if (!resolveResult.success || !resolveResult.data) {
    return NextResponse.json(
      { error: 'Captain not found' },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const captainId = resolveResult.data;

  // Fetch profile and trip types in parallel
  const [profileResult, tripTypesResult] = await Promise.all([
    getPublicCaptainProfile(captainId),
    getPublicTripTypes(captainId),
  ]);

  if (!profileResult.success || !profileResult.data) {
    const status = profileResult.code === 'HIBERNATING' ? 200 : 404;
    return NextResponse.json(
      {
        error: profileResult.error || 'Captain not found',
        hibernating: profileResult.code === 'HIBERNATING',
      },
      { status, headers: CORS_HEADERS }
    );
  }

  const profile = profileResult.data;
  const tripTypes = tripTypesResult.success ? tripTypesResult.data ?? [] : [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dockslot.app';
  const bookPath = `/book/${rawId}`;

  const response = {
    captain: {
      name: profile.business_name || profile.full_name || 'Charter Captain',
      tagline: profile.booking_tagline || null,
      accentColor: profile.brand_accent_color || '#0891b2',
      bookingUrl: `${appUrl}${bookPath}`,
    },
    trips: tripTypes.map((trip) => ({
      id: trip.id,
      title: trip.title,
      description: trip.description,
      durationHours: trip.duration_hours,
      priceTotal: trip.price_total,
      depositAmount: trip.deposit_amount,
      imageUrl: trip.image_url,
      bookingUrl: `${appUrl}${bookPath}/${trip.id}`,
    })),
  };

  return NextResponse.json(response, {
    headers: {
      ...CORS_HEADERS,
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
