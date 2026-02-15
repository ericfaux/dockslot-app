import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const PAGE_SIZE = 25;

/**
 * GET /api/guests
 *
 * Returns paginated guest list derived from bookings, grouped by guest email.
 *
 * Query Parameters:
 * - page: Page number (default 1)
 * - search: Search by guest name or email
 * - filter: 'all' | 'repeat' | 'new'
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const search = (searchParams.get('search') || '').trim();
    const filter = searchParams.get('filter') || 'all';

    // Fetch all bookings for this captain with trip type info
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        created_at,
        scheduled_start,
        guest_name,
        guest_email,
        guest_phone,
        party_size,
        total_price_cents,
        deposit_paid_cents,
        status,
        trip_type:trip_types(id, title)
      `
      )
      .eq('captain_id', user.id)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('[Guests API] Error fetching bookings:', bookingsError);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    // Group bookings by guest email
    const guestMap = new Map<
      string,
      {
        email: string;
        name: string;
        phone: string | null;
        bookings: typeof bookings;
        totalTrips: number;
        totalSpent: number;
        lastTripDate: string | null;
        firstTripDate: string | null;
        favoriteTrip: string | null;
      }
    >();

    for (const booking of bookings || []) {
      const email = booking.guest_email.toLowerCase();

      if (!guestMap.has(email)) {
        guestMap.set(email, {
          email: booking.guest_email,
          name: booking.guest_name,
          phone: booking.guest_phone,
          bookings: [],
          totalTrips: 0,
          totalSpent: 0,
          lastTripDate: null,
          firstTripDate: null,
          favoriteTrip: null,
        });
      }

      const guest = guestMap.get(email)!;
      guest.bookings.push(booking);

      if (booking.status !== 'cancelled' && booking.status !== 'no_show') {
        guest.totalTrips++;
        guest.totalSpent += booking.total_price_cents || 0;

        const tripDate = new Date(booking.scheduled_start);
        if (!guest.lastTripDate || tripDate > new Date(guest.lastTripDate)) {
          guest.lastTripDate = booking.scheduled_start;
        }
        if (!guest.firstTripDate || tripDate < new Date(guest.firstTripDate)) {
          guest.firstTripDate = booking.scheduled_start;
        }
      }
    }

    // Calculate favorite trip type for each guest
    guestMap.forEach((guest) => {
      const tripCounts = new Map<string, number>();
      guest.bookings.forEach((b: any) => {
        const tripType = Array.isArray(b.trip_type) ? b.trip_type[0] : b.trip_type;
        if (tripType?.title) {
          tripCounts.set(tripType.title, (tripCounts.get(tripType.title) || 0) + 1);
        }
      });

      let maxCount = 0;
      let favoriteTrip = null;
      tripCounts.forEach((count, trip) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteTrip = trip;
        }
      });

      guest.favoriteTrip = favoriteTrip;
    });

    const allGuests = Array.from(guestMap.values());

    // Sort by total trips (repeat guests first)
    allGuests.sort((a, b) => b.totalTrips - a.totalTrips);

    // Compute aggregate stats (before filtering)
    const totalGuestsCount = allGuests.length;
    const repeatGuestsCount = allGuests.filter((g) => g.totalTrips > 1).length;
    const newGuestsCount = allGuests.filter((g) => g.totalTrips === 1).length;
    const repeatRate = totalGuestsCount > 0 ? (repeatGuestsCount / totalGuestsCount) * 100 : 0;
    const avgTripsPerGuest =
      totalGuestsCount > 0
        ? allGuests.reduce((sum, g) => sum + g.totalTrips, 0) / totalGuestsCount
        : 0;

    // Apply search filter
    let filteredGuests = allGuests;
    if (search) {
      const q = search.toLowerCase();
      filteredGuests = filteredGuests.filter(
        (g) => g.name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q)
      );
    }

    // Apply type filter
    if (filter === 'repeat') {
      filteredGuests = filteredGuests.filter((g) => g.totalTrips > 1);
    } else if (filter === 'new') {
      filteredGuests = filteredGuests.filter((g) => g.totalTrips === 1);
    }

    // Paginate
    const totalFiltered = filteredGuests.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const from = (safePage - 1) * PAGE_SIZE;
    const to = Math.min(from + PAGE_SIZE, totalFiltered);
    const paginatedGuests = filteredGuests.slice(from, to);

    return NextResponse.json({
      guests: paginatedGuests,
      page: safePage,
      pageSize: PAGE_SIZE,
      totalCount: totalFiltered,
      totalPages,
      stats: {
        totalGuests: totalGuestsCount,
        repeatGuests: repeatGuestsCount,
        newGuests: newGuestsCount,
        repeatRate,
        avgTripsPerGuest,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/guests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
