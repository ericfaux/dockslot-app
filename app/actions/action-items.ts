'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { addDays, isPast, isToday, parseISO } from 'date-fns';

export interface ActionItem {
  id: string;
  type: 'payment' | 'waiver' | 'report' | 'alert';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  bookingId?: string;
}

export async function getActionItems(): Promise<ActionItem[]> {
  const supabase = await createSupabaseServerClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const items: ActionItem[] = [];

  // 1. PAYMENT ACTION ITEMS
  // Find confirmed bookings with balance due
  const { data: balanceDueBookings } = await supabase
    .from('bookings')
    .select('id, guest_name, scheduled_start, balance_due_cents, trip_type_id')
    .eq('profile_id', user.id)
    .in('status', ['confirmed', 'rescheduled'])
    .gt('balance_due_cents', 0)
    .gte('scheduled_start', new Date().toISOString())
    .order('scheduled_start', { ascending: true })
    .limit(10);

  if (balanceDueBookings) {
    for (const booking of balanceDueBookings) {
      const tripDate = parseISO(booking.scheduled_start);
      const daysUntil = Math.ceil((tripDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      
      // Fetch trip type title
      const { data: tripType } = await supabase
        .from('trip_types')
        .select('title')
        .eq('id', booking.trip_type_id)
        .single();
      
      // High priority if trip is within 3 days
      const priority = daysUntil <= 3 ? 'high' : daysUntil <= 7 ? 'medium' : 'low';
      
      items.push({
        id: `balance-${booking.id}`,
        type: 'payment',
        priority,
        title: `Request balance payment - ${booking.guest_name}`,
        description: `${tripType?.title || 'Trip'} in ${daysUntil} days • $${(booking.balance_due_cents / 100).toFixed(2)} due`,
        actionUrl: `/dashboard/schedule`,
        actionLabel: 'View Booking',
        bookingId: booking.id,
      });
    }
  }

  // Find pending deposit bookings (older than 24 hours)
  const dayAgo = addDays(new Date(), -1).toISOString();
  const { data: pendingDeposits } = await supabase
    .from('bookings')
    .select('id, guest_name, guest_email, created_at, trip_type_id')
    .eq('profile_id', user.id)
    .eq('status', 'pending_deposit')
    .lt('created_at', dayAgo)
    .order('created_at', { ascending: true })
    .limit(5);

  if (pendingDeposits) {
    for (const booking of pendingDeposits) {
      const { data: tripType } = await supabase
        .from('trip_types')
        .select('title')
        .eq('id', booking.trip_type_id)
        .single();
      
      items.push({
        id: `pending-${booking.id}`,
        type: 'payment',
        priority: 'medium',
        title: `Pending deposit - ${booking.guest_name}`,
        description: `Awaiting payment for ${tripType?.title || 'trip'} • ${booking.guest_email}`,
        actionUrl: `/dashboard/schedule`,
        actionLabel: 'View Booking',
        bookingId: booking.id,
      });
    }
  }

  // 2. TRIP REPORT ACTION ITEMS
  // Find completed trips without reports (within last 7 days)
  const weekAgo = addDays(new Date(), -7).toISOString();
  const { data: completedTrips } = await supabase
    .from('bookings')
    .select('id, guest_name, scheduled_start, trip_type_id')
    .eq('profile_id', user.id)
    .eq('status', 'completed')
    .gte('scheduled_start', weekAgo)
    .is('trip_report_id', null)
    .order('scheduled_start', { ascending: false })
    .limit(5);

  if (completedTrips) {
    for (const booking of completedTrips) {
      const tripDate = parseISO(booking.scheduled_start);
      const daysAgo = Math.ceil((Date.now() - tripDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const { data: tripType } = await supabase
        .from('trip_types')
        .select('title')
        .eq('id', booking.trip_type_id)
        .single();
      
      items.push({
        id: `report-${booking.id}`,
        type: 'report',
        priority: daysAgo >= 3 ? 'high' : 'medium',
        title: `Trip report needed - ${booking.guest_name}`,
        description: `${tripType?.title || 'Trip'} completed ${daysAgo} day${daysAgo === 1 ? '' : 's'} ago`,
        actionUrl: `/dashboard/reports/new?bookingId=${booking.id}`,
        actionLabel: 'Create Report',
        bookingId: booking.id,
      });
    }
  }

  // 3. WAIVER ACTION ITEMS
  // Find trips happening today/tomorrow without all waivers signed
  const tomorrow = addDays(new Date(), 2).toISOString();
  const { data: upcomingTrips } = await supabase
    .from('bookings')
    .select('id, guest_name, party_size, scheduled_start, trip_type_id, waiver_template_id')
    .eq('profile_id', user.id)
    .in('status', ['confirmed', 'rescheduled'])
    .gte('scheduled_start', new Date().toISOString())
    .lt('scheduled_start', tomorrow)
    .not('waiver_template_id', 'is', null)
    .order('scheduled_start', { ascending: true });

  if (upcomingTrips) {
    for (const booking of upcomingTrips) {
      // Check waiver signatures
      const { count: signedCount } = await supabase
        .from('waiver_signatures')
        .select('*', { count: 'exact', head: true })
        .eq('booking_id', booking.id)
        .eq('status', 'signed');

      const signed = signedCount || 0;
      const needed = booking.party_size || 1;

      if (signed < needed) {
        const tripDate = parseISO(booking.scheduled_start);
        const isImmediate = isToday(tripDate);
        
        const { data: tripType } = await supabase
          .from('trip_types')
          .select('title')
          .eq('id', booking.trip_type_id)
          .single();
        
        items.push({
          id: `waiver-${booking.id}`,
          type: 'waiver',
          priority: isImmediate ? 'high' : 'medium',
          title: `Waivers incomplete - ${booking.guest_name}`,
          description: `${signed}/${needed} waivers signed • ${tripType?.title || 'Trip'} ${isImmediate ? 'today' : 'tomorrow'}`,
          actionUrl: `/dashboard/schedule`,
          actionLabel: 'View Booking',
          bookingId: booking.id,
        });
      }
    }
  }

  // 4. ALERT ACTION ITEMS
  // Weather holds that are getting old (> 7 days)
  const { data: oldWeatherHolds } = await supabase
    .from('bookings')
    .select('id, guest_name, weather_hold_since, trip_type_id')
    .eq('profile_id', user.id)
    .eq('status', 'weather_hold')
    .lt('weather_hold_since', weekAgo)
    .order('weather_hold_since', { ascending: true })
    .limit(3);

  if (oldWeatherHolds) {
    for (const booking of oldWeatherHolds) {
      const holdDate = parseISO(booking.weather_hold_since);
      const daysOnHold = Math.ceil((Date.now() - holdDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const { data: tripType } = await supabase
        .from('trip_types')
        .select('title')
        .eq('id', booking.trip_type_id)
        .single();
      
      items.push({
        id: `alert-${booking.id}`,
        type: 'alert',
        priority: 'medium',
        title: `Weather hold needs resolution - ${booking.guest_name}`,
        description: `On hold for ${daysOnHold} days • ${tripType?.title || 'Trip'}`,
        actionUrl: `/dashboard/schedule`,
        actionLabel: 'Reschedule',
        bookingId: booking.id,
      });
    }
  }

  // Sort by priority (high -> medium -> low)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Limit total items to 10
  return items.slice(0, 10);
}
