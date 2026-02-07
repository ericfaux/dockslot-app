'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { weatherCache } from '@/lib/cache';
import type { PromoCodeStats } from '@/lib/db/types';

// Re-export the analytics cache using the same SimpleCache pattern
const analyticsCache = weatherCache; // Share cache singleton, keys are namespaced

// ============================================================================
// Types
// ============================================================================

export interface RevenueOverviewData {
  thisMonthRevenue: number;
  thisSeasonRevenue: number;
  allTimeRevenue: number;
  revenueByTripType: Array<{ name: string; revenue: number; count: number }>;
  revenueByMonth: Array<{ month: string; label: string; revenue: number }>;
  averageBookingValue: number;
  outstandingBalance: number;
  thisMonthChange: number;
}

export interface BookingInsightsData {
  statusBreakdown: Array<{ status: string; count: number; label: string }>;
  byDayOfWeek: Array<{ day: string; count: number; dayIndex: number }>;
  byTripType: Array<{ name: string; count: number; percentage: number }>;
  cancellationRate: number;
  weatherHoldRate: number;
  averagePartySize: number;
  averageLeadTimeDays: number;
  totalBookings: number;
}

export interface GuestAnalyticsData {
  totalUniqueGuests: number;
  repeatGuestRate: number;
  topGuestsByTrips: Array<{ name: string; email: string; trips: number; revenue: number }>;
  newVsReturning: Array<{ month: string; label: string; newGuests: number; returningGuests: number }>;
  repeatGuestCount: number;
}

export interface SeasonPerformanceData {
  utilizationRate: number;
  availableHoursPerWeek: number;
  bookedHoursThisSeason: number;
  revenueVsCapacity: { actual: number; potential: number };
  thisSeasonRevenue: number;
  lastSeasonRevenue: number;
  yearOverYearChange: number | null;
  weatherHoldImpact: { totalHolds: number; rescheduled: number; cancelled: number; revenueSaved: number };
}

// ============================================================================
// Helper: cents to dollars
// ============================================================================
function centsToDollars(cents: number): number {
  return Math.round(cents) / 100;
}

// ============================================================================
// Get Revenue Overview
// ============================================================================

export async function getRevenueOverview(): Promise<RevenueOverviewData> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const cacheKey = `analytics:revenue:${user.id}`;
  const cached = analyticsCache.get<RevenueOverviewData>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const seasonStart = new Date(now.getFullYear(), 0, 1).toISOString();

  // Fetch all bookings (non-cancelled) with trip type info
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, scheduled_start, status, payment_status, total_price_cents, deposit_paid_cents, balance_due_cents, created_at, trip_type:trip_types(title)')
    .eq('captain_id', user.id)
    .not('status', 'eq', 'cancelled');

  const allBookings = bookings || [];

  // Calculate revenue from paid bookings
  function bookingRevenue(b: { payment_status: string; total_price_cents: number; deposit_paid_cents: number }) {
    if (b.payment_status === 'fully_paid') return b.total_price_cents;
    if (b.payment_status === 'deposit_paid') return b.deposit_paid_cents;
    return 0;
  }

  // All-time revenue
  const allTimeRevenue = centsToDollars(allBookings.reduce((sum, b) => sum + bookingRevenue(b), 0));

  // This season revenue
  const seasonBookings = allBookings.filter(b => b.scheduled_start >= seasonStart);
  const thisSeasonRevenue = centsToDollars(seasonBookings.reduce((sum, b) => sum + bookingRevenue(b), 0));

  // This month revenue
  const thisMonthBookings = allBookings.filter(b => b.scheduled_start >= thisMonthStart);
  const thisMonthRevenue = centsToDollars(thisMonthBookings.reduce((sum, b) => sum + bookingRevenue(b), 0));

  // Last month revenue for comparison
  const lastMonthBookings = allBookings.filter(b =>
    b.scheduled_start >= lastMonthStart && b.scheduled_start <= lastMonthEnd
  );
  const lastMonthRevenue = centsToDollars(lastMonthBookings.reduce((sum, b) => sum + bookingRevenue(b), 0));
  const thisMonthChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  // Revenue by trip type
  const tripTypeMap = new Map<string, { revenue: number; count: number }>();
  allBookings.forEach(b => {
    const tripType = Array.isArray(b.trip_type) ? b.trip_type[0] : b.trip_type;
    const name = tripType?.title || 'Other';
    const entry = tripTypeMap.get(name) || { revenue: 0, count: 0 };
    entry.revenue += bookingRevenue(b);
    entry.count += 1;
    tripTypeMap.set(name, entry);
  });
  const revenueByTripType = Array.from(tripTypeMap.entries())
    .map(([name, { revenue, count }]) => ({ name, revenue: centsToDollars(revenue), count }))
    .sort((a, b) => b.revenue - a.revenue);

  // Revenue by month (last 12 months)
  const revenueByMonth: Array<{ month: string; label: string; revenue: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.toISOString();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
    const monthBookings = allBookings.filter(b =>
      b.scheduled_start >= monthStart && b.scheduled_start <= monthEnd
    );
    const rev = centsToDollars(monthBookings.reduce((sum, b) => sum + bookingRevenue(b), 0));
    revenueByMonth.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      revenue: rev,
    });
  }

  // Average booking value (non-cancelled, non-pending)
  const paidBookings = allBookings.filter(b =>
    !['pending_deposit', 'no_show'].includes(b.status)
  );
  const averageBookingValue = paidBookings.length > 0
    ? centsToDollars(paidBookings.reduce((sum, b) => sum + b.total_price_cents, 0) / paidBookings.length)
    : 0;

  // Outstanding balances
  const outstandingBalance = centsToDollars(
    allBookings
      .filter(b =>
        ['confirmed', 'rescheduled'].includes(b.status) &&
        b.payment_status !== 'fully_paid'
      )
      .reduce((sum, b) => sum + b.balance_due_cents, 0)
  );

  const result: RevenueOverviewData = {
    thisMonthRevenue,
    thisSeasonRevenue,
    allTimeRevenue,
    revenueByTripType,
    revenueByMonth,
    averageBookingValue,
    outstandingBalance,
    thisMonthChange,
  };

  analyticsCache.set(cacheKey, result, 300000); // 5 min TTL
  return result;
}

// ============================================================================
// Get Booking Insights
// ============================================================================

export async function getBookingInsights(): Promise<BookingInsightsData> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const cacheKey = `analytics:bookings:${user.id}`;
  const cached = analyticsCache.get<BookingInsightsData>(cacheKey);
  if (cached) return cached;

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, scheduled_start, status, party_size, created_at, weather_hold_reason, trip_type:trip_types(title)')
    .eq('captain_id', user.id);

  const allBookings = bookings || [];
  const totalBookings = allBookings.length;

  // Status breakdown
  const statusLabels: Record<string, string> = {
    pending_deposit: 'Pending Deposit',
    confirmed: 'Confirmed',
    weather_hold: 'Weather Hold',
    rescheduled: 'Rescheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
    expired: 'Expired',
  };
  const statusMap = new Map<string, number>();
  allBookings.forEach(b => {
    statusMap.set(b.status, (statusMap.get(b.status) || 0) + 1);
  });
  const statusBreakdown = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, count, label: statusLabels[status] || status }))
    .sort((a, b) => b.count - a.count);

  // By day of week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayCountMap = new Map<number, number>();
  allBookings.forEach(b => {
    const day = new Date(b.scheduled_start).getDay();
    dayCountMap.set(day, (dayCountMap.get(day) || 0) + 1);
  });
  const byDayOfWeek = dayNames.map((day, idx) => ({
    day,
    count: dayCountMap.get(idx) || 0,
    dayIndex: idx,
  }));

  // By trip type
  const tripCounts = new Map<string, number>();
  allBookings.forEach(b => {
    const tripType = Array.isArray(b.trip_type) ? b.trip_type[0] : b.trip_type;
    const name = tripType?.title || 'Other';
    tripCounts.set(name, (tripCounts.get(name) || 0) + 1);
  });
  const byTripType = Array.from(tripCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalBookings > 0 ? (count / totalBookings) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Rates
  const cancelledCount = allBookings.filter(b => b.status === 'cancelled').length;
  const cancellationRate = totalBookings > 0 ? (cancelledCount / totalBookings) * 100 : 0;

  const weatherHoldCount = allBookings.filter(b =>
    b.status === 'weather_hold' || b.weather_hold_reason
  ).length;
  const weatherHoldRate = totalBookings > 0 ? (weatherHoldCount / totalBookings) * 100 : 0;

  // Average party size (non-cancelled)
  const validBookings = allBookings.filter(b => !['cancelled', 'no_show'].includes(b.status));
  const averagePartySize = validBookings.length > 0
    ? validBookings.reduce((sum, b) => sum + b.party_size, 0) / validBookings.length
    : 0;

  // Average lead time (days between created_at and scheduled_start)
  const leadTimes = allBookings
    .filter(b => b.created_at && b.scheduled_start)
    .map(b => {
      const created = new Date(b.created_at).getTime();
      const scheduled = new Date(b.scheduled_start).getTime();
      return Math.max(0, (scheduled - created) / (1000 * 60 * 60 * 24));
    });
  const averageLeadTimeDays = leadTimes.length > 0
    ? leadTimes.reduce((sum, d) => sum + d, 0) / leadTimes.length
    : 0;

  const result: BookingInsightsData = {
    statusBreakdown,
    byDayOfWeek,
    byTripType,
    cancellationRate,
    weatherHoldRate,
    averagePartySize,
    averageLeadTimeDays,
    totalBookings,
  };

  analyticsCache.set(cacheKey, result, 300000);
  return result;
}

// ============================================================================
// Get Guest Analytics
// ============================================================================

export async function getGuestAnalytics(): Promise<GuestAnalyticsData> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const cacheKey = `analytics:guests:${user.id}`;
  const cached = analyticsCache.get<GuestAnalyticsData>(cacheKey);
  if (cached) return cached;

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_email, scheduled_start, status, total_price_cents, deposit_paid_cents, payment_status, created_at')
    .eq('captain_id', user.id)
    .not('status', 'eq', 'cancelled');

  const allBookings = bookings || [];

  // Group by guest email
  const guestMap = new Map<string, typeof allBookings>();
  allBookings.forEach(b => {
    const email = b.guest_email.toLowerCase();
    if (!guestMap.has(email)) guestMap.set(email, []);
    guestMap.get(email)!.push(b);
  });

  const totalUniqueGuests = guestMap.size;

  // Repeat guests (2+ bookings that are confirmed/completed)
  let repeatGuestCount = 0;
  guestMap.forEach(guestBookings => {
    const validBookings = guestBookings.filter(b =>
      ['confirmed', 'completed', 'rescheduled'].includes(b.status)
    );
    if (validBookings.length >= 2) repeatGuestCount++;
  });
  const repeatGuestRate = totalUniqueGuests > 0
    ? (repeatGuestCount / totalUniqueGuests) * 100
    : 0;

  // Top guests by trips and revenue
  function guestRevenue(b: { payment_status: string; total_price_cents: number; deposit_paid_cents: number }) {
    if (b.payment_status === 'fully_paid') return b.total_price_cents;
    if (b.payment_status === 'deposit_paid') return b.deposit_paid_cents;
    return 0;
  }

  const topGuestsByTrips = Array.from(guestMap.entries())
    .map(([email, guestBookings]) => ({
      name: guestBookings[0].guest_name,
      email,
      trips: guestBookings.length,
      revenue: centsToDollars(guestBookings.reduce((sum, b) => sum + guestRevenue(b), 0)),
    }))
    .sort((a, b) => b.trips - a.trips || b.revenue - a.revenue)
    .slice(0, 10);

  // New vs returning guests over the last 6 months
  const now = new Date();
  const newVsReturning: Array<{ month: string; label: string; newGuests: number; returningGuests: number }> = [];
  const seenGuestsBefore = new Set<string>();

  // Process all bookings chronologically to track first appearance
  const sortedBookings = [...allBookings].sort(
    (a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime()
  );

  // First pass: find each guest's first booking date
  const guestFirstBooking = new Map<string, string>();
  sortedBookings.forEach(b => {
    const email = b.guest_email.toLowerCase();
    if (!guestFirstBooking.has(email)) {
      guestFirstBooking.set(email, b.scheduled_start);
    }
  });

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.toISOString();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const monthBookings = allBookings.filter(b =>
      b.scheduled_start >= monthStart && b.scheduled_start <= monthEnd
    );

    const monthGuests = new Set<string>();
    let newCount = 0;
    let returningCount = 0;

    monthBookings.forEach(b => {
      const email = b.guest_email.toLowerCase();
      if (monthGuests.has(email)) return; // Don't double-count within a month
      monthGuests.add(email);

      const firstDate = guestFirstBooking.get(email);
      if (firstDate && firstDate >= monthStart && firstDate <= monthEnd) {
        newCount++;
      } else {
        returningCount++;
      }
    });

    newVsReturning.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      newGuests: newCount,
      returningGuests: returningCount,
    });
  }

  const result: GuestAnalyticsData = {
    totalUniqueGuests,
    repeatGuestRate,
    topGuestsByTrips,
    newVsReturning,
    repeatGuestCount,
  };

  analyticsCache.set(cacheKey, result, 300000);
  return result;
}

// ============================================================================
// Get Season Performance
// ============================================================================

export async function getSeasonPerformance(): Promise<SeasonPerformanceData> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const cacheKey = `analytics:season:${user.id}`;
  const cached = analyticsCache.get<SeasonPerformanceData>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const lastSeasonStart = new Date(now.getFullYear() - 1, 0, 1).toISOString();
  const lastSeasonEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString();

  // Fetch this season's bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, scheduled_start, scheduled_end, status, payment_status, total_price_cents, deposit_paid_cents, weather_hold_reason, original_date_if_rescheduled, balance_due_cents')
    .eq('captain_id', user.id)
    .gte('scheduled_start', seasonStart);

  // Fetch last season's bookings
  const { data: lastSeasonBookings } = await supabase
    .from('bookings')
    .select('id, total_price_cents, deposit_paid_cents, payment_status')
    .eq('captain_id', user.id)
    .gte('scheduled_start', lastSeasonStart)
    .lte('scheduled_start', lastSeasonEnd)
    .not('status', 'eq', 'cancelled');

  // Fetch availability windows
  const { data: availability } = await supabase
    .from('availability_windows')
    .select('day_of_week, start_time, end_time, is_active')
    .eq('owner_id', user.id)
    .eq('is_active', true);

  const thisBookings = (bookings || []).filter(b => b.status !== 'cancelled');
  const lastBookings = lastSeasonBookings || [];

  function bookingRevenue(b: { payment_status: string; total_price_cents: number; deposit_paid_cents: number }) {
    if (b.payment_status === 'fully_paid') return b.total_price_cents;
    if (b.payment_status === 'deposit_paid') return b.deposit_paid_cents;
    return 0;
  }

  // Revenue calculations
  const thisSeasonRevenue = centsToDollars(thisBookings.reduce((sum, b) => sum + bookingRevenue(b), 0));
  const lastSeasonRevenue = centsToDollars(lastBookings.reduce((sum, b) => sum + bookingRevenue(b), 0));
  const yearOverYearChange = lastSeasonRevenue > 0
    ? ((thisSeasonRevenue - lastSeasonRevenue) / lastSeasonRevenue) * 100
    : null;

  // Available hours per week from availability windows
  const availWindows = availability || [];
  let availableHoursPerWeek = 0;
  availWindows.forEach(w => {
    const [startH, startM] = w.start_time.split(':').map(Number);
    const [endH, endM] = w.end_time.split(':').map(Number);
    const hours = (endH + endM / 60) - (startH + startM / 60);
    if (hours > 0) availableHoursPerWeek += hours;
  });

  // Booked hours this season
  let bookedHoursThisSeason = 0;
  thisBookings.forEach(b => {
    if (b.scheduled_start && b.scheduled_end) {
      const start = new Date(b.scheduled_start).getTime();
      const end = new Date(b.scheduled_end).getTime();
      bookedHoursThisSeason += (end - start) / (1000 * 60 * 60);
    }
  });

  // Utilization rate
  const weeksSoFar = Math.max(1, Math.ceil(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24 * 7)
  ));
  const totalAvailableHours = availableHoursPerWeek * weeksSoFar;
  const utilizationRate = totalAvailableHours > 0
    ? Math.min(100, (bookedHoursThisSeason / totalAvailableHours) * 100)
    : 0;

  // Revenue vs capacity potential
  const avgRevenuePerHour = bookedHoursThisSeason > 0
    ? (thisSeasonRevenue / bookedHoursThisSeason)
    : 0;
  const potentialRevenue = totalAvailableHours > 0
    ? avgRevenuePerHour * totalAvailableHours
    : 0;

  // Weather hold impact
  const weatherHolds = thisBookings.filter(b =>
    b.status === 'weather_hold' || b.weather_hold_reason
  );
  const rescheduledFromWeather = thisBookings.filter(b =>
    b.original_date_if_rescheduled && b.weather_hold_reason &&
    ['rescheduled', 'confirmed', 'completed'].includes(b.status)
  );
  const cancelledFromWeather = (bookings || []).filter(b =>
    b.status === 'cancelled' && b.weather_hold_reason
  );
  const revenueSaved = centsToDollars(
    rescheduledFromWeather.reduce((sum, b) => sum + bookingRevenue(b), 0)
  );

  const result: SeasonPerformanceData = {
    utilizationRate,
    availableHoursPerWeek,
    bookedHoursThisSeason: Math.round(bookedHoursThisSeason * 10) / 10,
    revenueVsCapacity: { actual: thisSeasonRevenue, potential: Math.round(potentialRevenue) },
    thisSeasonRevenue,
    lastSeasonRevenue,
    yearOverYearChange,
    weatherHoldImpact: {
      totalHolds: weatherHolds.length,
      rescheduled: rescheduledFromWeather.length,
      cancelled: cancelledFromWeather.length,
      revenueSaved,
    },
  };

  analyticsCache.set(cacheKey, result, 300000);
  return result;
}

// ============================================================================
// Promo Code Analytics
// ============================================================================

export interface PromoCodeAnalyticsData {
  totalCodes: number;
  activeCodes: number;
  totalUses: number;
  totalDiscountGiven: number; // dollars
  totalRevenueFromPromos: number; // dollars
  codePerformance: Array<{
    id: string;
    code: string;
    discountType: string;
    discountValue: number;
    uses: number;
    maxUses: number | null;
    discountGiven: number; // dollars
    revenueGenerated: number; // dollars
    isActive: boolean;
    validFrom: string | null;
    validTo: string | null;
  }>;
  usageByMonth: Array<{
    month: string;
    label: string;
    uses: number;
    discountGiven: number;
    revenue: number;
  }>;
}

export async function getPromoCodeAnalytics(): Promise<PromoCodeAnalyticsData> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const cacheKey = `analytics:promos:${user.id}`;
  const cached = analyticsCache.get<PromoCodeAnalyticsData>(cacheKey);
  if (cached) return cached;

  // Fetch all promo codes
  const { data: promoCodes } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('captain_id', user.id)
    .order('current_uses', { ascending: false });

  const allCodes = promoCodes || [];

  // Fetch bookings with promo codes for monthly breakdown
  const { data: promoBookings } = await supabase
    .from('bookings')
    .select('id, scheduled_start, total_price_cents, promo_discount_cents, promo_code_id')
    .eq('captain_id', user.id)
    .not('promo_code_id', 'is', null)
    .not('status', 'eq', 'cancelled');

  const allPromoBookings = promoBookings || [];

  const totalCodes = allCodes.length;
  const activeCodes = allCodes.filter(c => c.is_active).length;
  const totalUses = allCodes.reduce((sum, c) => sum + c.current_uses, 0);
  const totalDiscountGiven = centsToDollars(allCodes.reduce((sum, c) => sum + (c.total_discount_cents || 0), 0));
  const totalRevenueFromPromos = centsToDollars(allCodes.reduce((sum, c) => sum + (c.total_booking_revenue_cents || 0), 0));

  const codePerformance = allCodes.map(c => ({
    id: c.id,
    code: c.code,
    discountType: c.discount_type,
    discountValue: c.discount_value,
    uses: c.current_uses,
    maxUses: c.max_uses,
    discountGiven: centsToDollars(c.total_discount_cents || 0),
    revenueGenerated: centsToDollars(c.total_booking_revenue_cents || 0),
    isActive: c.is_active,
    validFrom: c.valid_from,
    validTo: c.valid_to,
  }));

  // Usage by month (last 6 months)
  const now = new Date();
  const usageByMonth: PromoCodeAnalyticsData['usageByMonth'] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = d.toISOString();
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const monthBookings = allPromoBookings.filter(b =>
      b.scheduled_start >= monthStart && b.scheduled_start <= monthEnd
    );

    usageByMonth.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      uses: monthBookings.length,
      discountGiven: centsToDollars(monthBookings.reduce((sum, b) => sum + (b.promo_discount_cents || 0), 0)),
      revenue: centsToDollars(monthBookings.reduce((sum, b) => sum + b.total_price_cents, 0)),
    });
  }

  const result: PromoCodeAnalyticsData = {
    totalCodes,
    activeCodes,
    totalUses,
    totalDiscountGiven,
    totalRevenueFromPromos,
    codePerformance,
    usageByMonth,
  };

  analyticsCache.set(cacheKey, result, 300000);
  return result;
}
