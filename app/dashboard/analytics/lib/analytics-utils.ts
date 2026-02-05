import { startOfMonth, endOfMonth, subMonths, format, parseISO, getDay, eachMonthOfInterval, startOfYear, subYears } from 'date-fns';

export interface AnalyticsBooking {
  id: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  payment_status: string;
  total_price_cents: number;
  deposit_paid_cents: number;
  balance_due_cents: number;
  party_size: number;
  guest_name: string;
  guest_email: string;
  weather_hold_reason: string | null;
  original_date_if_rescheduled: string | null;
  created_at: string;
  trip_type?: { id: string; title: string } | null;
  vessel?: { id: string; name: string } | null;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount_cents: number;
  payment_type: 'deposit' | 'balance' | 'refund' | 'tip';
  status: string;
  created_at: string;
}

export interface WeatherMetrics {
  weatherHoldsThisSeason: number;
  weatherHoldsTotal: number;
  rescheduledFromWeather: number;
  cancelledFromWeather: number;
  recoveryRate: number;
  revenueSavedByReschedule: number;
}

export interface CustomerMetrics {
  repeatCustomers: number;
  totalUniqueGuests: number;
  repeatRate: number;
  averagePartySize: number;
  mostPopularTripType: { name: string; count: number; percentage: number } | null;
  tripTypeBreakdown: Array<{ name: string; count: number; percentage: number }>;
}

export interface SeasonalMetrics {
  revenueByMonth: Array<{ month: string; monthLabel: string; revenue: number; bookings: number }>;
  bookingsByMonth: Array<{ month: string; monthLabel: string; count: number }>;
  seasonToDate: number;
  samePeriodLastYear: number;
  yearOverYearChange: number | null;
}

export interface PaymentMetrics {
  totalCollected: number;
  totalDeposits: number;
  totalBalancePayments: number;
  outstandingBalance: number;
  refundsIssued: number;
  tipsReceived: number;
  averageBookingValue: number;
  depositPercentage: number;
}

export interface QuickStats {
  thisMonthRevenue: number;
  thisMonthChange: number;
  tripsCompleted: number;
  upcomingTrips: number;
  weatherSaves: number;
}

export interface ActionableInsight {
  type: 'tip' | 'alert' | 'opportunity';
  message: string;
  metric?: string;
}

// Calculate weather impact metrics
export function calculateWeatherMetrics(bookings: AnalyticsBooking[]): WeatherMetrics {
  const now = new Date();
  const seasonStart = new Date(now.getFullYear(), 0, 1); // Start of year as "season"

  // All weather holds ever
  const weatherHolds = bookings.filter(b =>
    b.status === 'weather_hold' || b.weather_hold_reason
  );

  // Weather holds this season
  const weatherHoldsThisSeason = bookings.filter(b => {
    const date = parseISO(b.scheduled_start);
    return (b.status === 'weather_hold' || b.weather_hold_reason) && date >= seasonStart;
  }).length;

  // Rescheduled from weather (have original_date_if_rescheduled and weather_hold_reason)
  const rescheduledFromWeather = bookings.filter(b =>
    b.original_date_if_rescheduled &&
    b.weather_hold_reason &&
    (b.status === 'rescheduled' || b.status === 'confirmed' || b.status === 'completed')
  );

  // Cancelled that had weather hold
  const cancelledFromWeather = bookings.filter(b =>
    b.status === 'cancelled' && b.weather_hold_reason
  ).length;

  // Calculate recovery rate
  const totalWeatherAffected = rescheduledFromWeather.length + cancelledFromWeather;
  const recoveryRate = totalWeatherAffected > 0
    ? (rescheduledFromWeather.length / totalWeatherAffected) * 100
    : 0;

  // Revenue saved by reschedule
  const revenueSavedByReschedule = rescheduledFromWeather.reduce(
    (sum, b) => sum + (b.deposit_paid_cents || 0),
    0
  ) / 100;

  return {
    weatherHoldsThisSeason,
    weatherHoldsTotal: weatherHolds.length,
    rescheduledFromWeather: rescheduledFromWeather.length,
    cancelledFromWeather,
    recoveryRate,
    revenueSavedByReschedule,
  };
}

// Calculate customer insights
export function calculateCustomerMetrics(bookings: AnalyticsBooking[]): CustomerMetrics {
  // Group by guest email (lowercase for consistency)
  const guestMap = new Map<string, AnalyticsBooking[]>();

  bookings.forEach(b => {
    const email = b.guest_email.toLowerCase();
    if (!guestMap.has(email)) {
      guestMap.set(email, []);
    }
    guestMap.get(email)!.push(b);
  });

  const totalUniqueGuests = guestMap.size;

  // Repeat customers (2+ bookings)
  let repeatCustomers = 0;
  guestMap.forEach(guestBookings => {
    const confirmedOrCompleted = guestBookings.filter(b =>
      ['confirmed', 'completed', 'rescheduled'].includes(b.status)
    );
    if (confirmedOrCompleted.length >= 2) {
      repeatCustomers++;
    }
  });

  const repeatRate = totalUniqueGuests > 0
    ? (repeatCustomers / totalUniqueGuests) * 100
    : 0;

  // Average party size
  const validBookings = bookings.filter(b =>
    !['cancelled', 'no_show'].includes(b.status)
  );
  const averagePartySize = validBookings.length > 0
    ? validBookings.reduce((sum, b) => sum + b.party_size, 0) / validBookings.length
    : 0;

  // Trip type breakdown
  const tripTypeCounts = new Map<string, number>();
  bookings.forEach(b => {
    if (b.trip_type?.title) {
      tripTypeCounts.set(
        b.trip_type.title,
        (tripTypeCounts.get(b.trip_type.title) || 0) + 1
      );
    }
  });

  const tripTypeBreakdown = Array.from(tripTypeCounts.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / bookings.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const mostPopularTripType = tripTypeBreakdown[0] || null;

  return {
    repeatCustomers,
    totalUniqueGuests,
    repeatRate,
    averagePartySize,
    mostPopularTripType,
    tripTypeBreakdown,
  };
}

// Calculate seasonal metrics
export function calculateSeasonalMetrics(bookings: AnalyticsBooking[]): SeasonalMetrics {
  const now = new Date();
  const twelveMonthsAgo = subMonths(now, 11);
  const months = eachMonthOfInterval({ start: twelveMonthsAgo, end: now });

  // Revenue and bookings by month
  const revenueByMonth = months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const monthBookings = bookings.filter(b => {
      const date = parseISO(b.scheduled_start);
      return date >= monthStart && date <= monthEnd;
    });

    const revenue = monthBookings.reduce(
      (sum, b) => sum + (b.deposit_paid_cents || 0),
      0
    ) / 100;

    return {
      month: format(month, 'yyyy-MM'),
      monthLabel: format(month, 'MMM'),
      revenue,
      bookings: monthBookings.length,
    };
  });

  const bookingsByMonth = revenueByMonth.map(m => ({
    month: m.month,
    monthLabel: m.monthLabel,
    count: m.bookings,
  }));

  // Season to date (this year)
  const thisYearStart = startOfYear(now);
  const seasonToDate = bookings
    .filter(b => parseISO(b.scheduled_start) >= thisYearStart)
    .reduce((sum, b) => sum + (b.deposit_paid_cents || 0), 0) / 100;

  // Same period last year
  const lastYearStart = startOfYear(subYears(now, 1));
  const lastYearSamePeriodEnd = subYears(now, 1);
  const samePeriodLastYear = bookings
    .filter(b => {
      const date = parseISO(b.scheduled_start);
      return date >= lastYearStart && date <= lastYearSamePeriodEnd;
    })
    .reduce((sum, b) => sum + (b.deposit_paid_cents || 0), 0) / 100;

  // Year over year change
  const yearOverYearChange = samePeriodLastYear > 0
    ? ((seasonToDate - samePeriodLastYear) / samePeriodLastYear) * 100
    : null;

  return {
    revenueByMonth,
    bookingsByMonth,
    seasonToDate,
    samePeriodLastYear,
    yearOverYearChange,
  };
}

// Calculate payment metrics
export function calculatePaymentMetrics(
  bookings: AnalyticsBooking[],
  payments?: Payment[]
): PaymentMetrics {
  // Total collected from bookings
  const totalCollected = bookings.reduce(
    (sum, b) => sum + (b.deposit_paid_cents || 0),
    0
  ) / 100;

  // If payments data provided, use it for detailed breakdown
  let totalDeposits = 0;
  let totalBalancePayments = 0;
  let refundsIssued = 0;
  let tipsReceived = 0;

  if (payments && payments.length > 0) {
    payments.forEach(p => {
      if (p.status === 'succeeded') {
        switch (p.payment_type) {
          case 'deposit':
            totalDeposits += p.amount_cents;
            break;
          case 'balance':
            totalBalancePayments += p.amount_cents;
            break;
          case 'refund':
            refundsIssued += p.amount_cents;
            break;
          case 'tip':
            tipsReceived += p.amount_cents;
            break;
        }
      }
    });

    totalDeposits /= 100;
    totalBalancePayments /= 100;
    refundsIssued /= 100;
    tipsReceived /= 100;
  } else {
    // Estimate from bookings
    totalDeposits = bookings
      .filter(b => ['deposit_paid', 'fully_paid'].includes(b.payment_status))
      .reduce((sum, b) => sum + (b.deposit_paid_cents || 0), 0) / 100;

    totalBalancePayments = bookings
      .filter(b => b.payment_status === 'fully_paid')
      .reduce((sum, b) => sum + (b.balance_due_cents || 0), 0) / 100;
  }

  // Outstanding balances
  const outstandingBalance = bookings
    .filter(b =>
      ['confirmed', 'rescheduled'].includes(b.status) &&
      b.payment_status !== 'fully_paid'
    )
    .reduce((sum, b) => sum + (b.balance_due_cents || 0), 0) / 100;

  // Average booking value
  const completedBookings = bookings.filter(b =>
    !['cancelled', 'no_show', 'pending_deposit'].includes(b.status)
  );
  const averageBookingValue = completedBookings.length > 0
    ? completedBookings.reduce((sum, b) => sum + (b.total_price_cents || 0), 0) / completedBookings.length / 100
    : 0;

  // Deposit vs full payment percentage
  const depositOnlyCount = bookings.filter(b => b.payment_status === 'deposit_paid').length;
  const fullyPaidCount = bookings.filter(b => b.payment_status === 'fully_paid').length;
  const depositPercentage = (depositOnlyCount + fullyPaidCount) > 0
    ? (depositOnlyCount / (depositOnlyCount + fullyPaidCount)) * 100
    : 0;

  return {
    totalCollected,
    totalDeposits,
    totalBalancePayments,
    outstandingBalance,
    refundsIssued,
    tipsReceived,
    averageBookingValue,
    depositPercentage,
  };
}

// Calculate quick stats for the top cards
export function calculateQuickStats(bookings: AnalyticsBooking[]): QuickStats {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  // This month revenue
  const thisMonthBookings = bookings.filter(b => {
    const date = parseISO(b.scheduled_start);
    return date >= thisMonthStart && date <= thisMonthEnd;
  });
  const thisMonthRevenue = thisMonthBookings.reduce(
    (sum, b) => sum + (b.deposit_paid_cents || 0),
    0
  ) / 100;

  // Last month revenue
  const lastMonthBookings = bookings.filter(b => {
    const date = parseISO(b.scheduled_start);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });
  const lastMonthRevenue = lastMonthBookings.reduce(
    (sum, b) => sum + (b.deposit_paid_cents || 0),
    0
  ) / 100;

  const thisMonthChange = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;

  // Trips completed (all time)
  const tripsCompleted = bookings.filter(b => b.status === 'completed').length;

  // Upcoming trips (confirmed, in the future)
  const upcomingTrips = bookings.filter(b => {
    const date = parseISO(b.scheduled_start);
    return date > now && ['confirmed', 'rescheduled'].includes(b.status);
  }).length;

  // Weather saves (rescheduled from weather hold)
  const weatherSaves = bookings.filter(b =>
    b.original_date_if_rescheduled &&
    b.weather_hold_reason &&
    !['cancelled', 'no_show'].includes(b.status)
  ).length;

  return {
    thisMonthRevenue,
    thisMonthChange,
    tripsCompleted,
    upcomingTrips,
    weatherSaves,
  };
}

// Generate actionable insights
export function generateInsights(
  bookings: AnalyticsBooking[],
  weatherMetrics: WeatherMetrics,
  customerMetrics: CustomerMetrics,
  seasonalMetrics: SeasonalMetrics
): ActionableInsight[] {
  const insights: ActionableInsight[] = [];

  // Day of week analysis
  const dayOfWeekCounts = new Map<number, number>();
  bookings.forEach(b => {
    const day = getDay(parseISO(b.scheduled_start));
    dayOfWeekCounts.set(day, (dayOfWeekCounts.get(day) || 0) + 1);
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let busiestDay = 0;
  let maxCount = 0;
  dayOfWeekCounts.forEach((count, day) => {
    if (count > maxCount) {
      maxCount = count;
      busiestDay = day;
    }
  });

  if (maxCount > 0 && bookings.length >= 5) {
    insights.push({
      type: 'tip',
      message: `Your ${dayNames[busiestDay]} trips sell out fastest`,
      metric: `${maxCount} bookings`,
    });
  }

  // Weather recovery insight
  if (weatherMetrics.recoveryRate >= 70) {
    insights.push({
      type: 'tip',
      message: `Great weather recovery rate! ${weatherMetrics.recoveryRate.toFixed(0)}% of weather holds rescheduled`,
      metric: `$${weatherMetrics.revenueSavedByReschedule.toLocaleString()} saved`,
    });
  } else if (weatherMetrics.weatherHoldsTotal > 0 && weatherMetrics.recoveryRate < 50) {
    insights.push({
      type: 'opportunity',
      message: 'Consider offering more reschedule options to improve weather hold recovery',
      metric: `${weatherMetrics.recoveryRate.toFixed(0)}% recovery rate`,
    });
  }

  // Repeat customer insight
  if (customerMetrics.repeatRate >= 20) {
    insights.push({
      type: 'tip',
      message: `Strong repeat business! ${customerMetrics.repeatRate.toFixed(0)}% of guests book again`,
      metric: `${customerMetrics.repeatCustomers} repeat guests`,
    });
  }

  // Most popular trip insight
  if (customerMetrics.mostPopularTripType && customerMetrics.tripTypeBreakdown.length > 1) {
    insights.push({
      type: 'tip',
      message: `"${customerMetrics.mostPopularTripType.name}" is your most popular offering`,
      metric: `${customerMetrics.mostPopularTripType.percentage.toFixed(0)}% of bookings`,
    });
  }

  // Year over year insight
  if (seasonalMetrics.yearOverYearChange !== null) {
    if (seasonalMetrics.yearOverYearChange > 0) {
      insights.push({
        type: 'tip',
        message: `Revenue up ${seasonalMetrics.yearOverYearChange.toFixed(0)}% compared to same period last year`,
      });
    } else if (seasonalMetrics.yearOverYearChange < -10) {
      insights.push({
        type: 'alert',
        message: `Revenue down ${Math.abs(seasonalMetrics.yearOverYearChange).toFixed(0)}% from last year`,
      });
    }
  }

  // Party size insight
  if (customerMetrics.averagePartySize > 0) {
    insights.push({
      type: 'tip',
      message: `Average group size is ${customerMetrics.averagePartySize.toFixed(1)} guests`,
    });
  }

  return insights.slice(0, 4); // Limit to 4 insights
}
