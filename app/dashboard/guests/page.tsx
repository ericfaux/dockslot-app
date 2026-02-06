import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/auth/server';
import { GuestsList } from './components/GuestsList';
import { Users, TrendingUp } from 'lucide-react';

export default async function GuestsPage() {
  const { user, supabase } = await requireAuth()

  // Fetch all bookings to build guest analytics
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
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
    `)
    .eq('captain_id', user.id)
    .order('created_at', { ascending: false });

  // Group bookings by guest email
  const guestMap = new Map<string, any>();

  (bookings || []).forEach((booking) => {
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

    const guest = guestMap.get(email);
    guest.bookings.push(booking);
    
    if (booking.status !== 'cancelled' && booking.status !== 'no_show') {
      guest.totalTrips++;
      guest.totalSpent += booking.total_price_cents || 0;
    }

    const tripDate = new Date(booking.scheduled_start);
    if (!guest.lastTripDate || tripDate > new Date(guest.lastTripDate)) {
      guest.lastTripDate = booking.scheduled_start;
    }
    if (!guest.firstTripDate || tripDate < new Date(guest.firstTripDate)) {
      guest.firstTripDate = booking.scheduled_start;
    }
  });

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

  const guests = Array.from(guestMap.values());

  // Sort by total trips (repeat guests first)
  guests.sort((a, b) => b.totalTrips - a.totalTrips);

  // Stats
  const totalGuests = guests.length;
  const repeatGuests = guests.filter((g) => g.totalTrips > 1).length;
  const repeatRate = totalGuests > 0 ? (repeatGuests / totalGuests) * 100 : 0;
  const avgTripsPerGuest =
    totalGuests > 0 ? guests.reduce((sum, g) => sum + g.totalTrips, 0) / totalGuests : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guest Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          Track repeat customers and build relationships
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalGuests}</p>
              <p className="text-sm text-slate-400">Total Guests</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20">
              <TrendingUp className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{repeatGuests}</p>
              <p className="text-sm text-slate-400">Repeat Guests</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{repeatRate.toFixed(0)}%</p>
              <p className="text-sm text-slate-400">Repeat Rate</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
              <Users className="h-5 w-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{avgTripsPerGuest.toFixed(1)}</p>
              <p className="text-sm text-slate-400">Avg Trips/Guest</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guests List */}
      <GuestsList guests={guests} />
    </div>
  );
}
