import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { getBookingsWithFilters, BookingListFilters } from '@/lib/data/bookings';
import { BookingStatus, BOOKING_STATUSES } from '@/lib/db/types';
import { addMonths, format } from 'date-fns';
import crypto from 'crypto';
import { sendBookingConfirmation } from '@/lib/email/resend';
import { checkAllConflicts } from '@/lib/booking-conflicts';

const VALID_SORT_FIELDS = ['scheduled_start', 'guest_name', 'status', 'created_at'] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

/**
 * GET /api/bookings
 *
 * Retrieves bookings with filtering and pagination.
 *
 * Query Parameters:
 * - captainId (required): UUID of the captain
 * - startDate: Filter by scheduled_start >= date (YYYY-MM-DD)
 * - endDate: Filter by scheduled_start <= date (YYYY-MM-DD)
 * - status: Comma-separated list of statuses to filter
 * - vesselId: Filter by vessel UUID
 * - search: Search by guest name
 * - includeHistorical: Include completed/cancelled/no-show (boolean)
 * - sortField: Field to sort by (scheduled_start, guest_name, status, created_at)
 * - sortDir: Sort direction (asc, desc)
 * - cursor: Pagination cursor
 * - limit: Number of results (1-100, default 20)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const captainId = searchParams.get('captainId');

    if (!captainId) {
      return NextResponse.json(
        { error: 'captainId is required' },
        { status: 400 }
      );
    }

    // Verify user is the captain or has access
    if (user.id !== captainId) {
      return NextResponse.json(
        { error: 'Access denied to this captain\'s bookings' },
        { status: 403 }
      );
    }

    // Parse optional filters
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const vesselId = searchParams.get('vesselId') || undefined;
    const search = searchParams.get('search') || undefined;
    const includeHistorical = searchParams.get('includeHistorical') === 'true';
    const cursor = searchParams.get('cursor') || undefined;

    // Parse and validate status filter
    let status: BookingStatus[] | undefined;
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const statusValues = statusParam.split(',');
      const validStatuses = statusValues.filter(
        (s): s is BookingStatus => BOOKING_STATUSES.includes(s as BookingStatus)
      );
      if (validStatuses.length > 0) {
        status = validStatuses;
      }
    }

    // Parse payment status filter
    let paymentStatus: string[] | undefined;
    const paymentStatusParam = searchParams.get('paymentStatus');
    if (paymentStatusParam) {
      const paymentValues = paymentStatusParam.split(',').filter(Boolean);
      if (paymentValues.length > 0) {
        paymentStatus = paymentValues;
      }
    }

    // Parse tags filter
    let tags: string[] | undefined;
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      const tagValues = tagsParam.split(',').filter(Boolean);
      if (tagValues.length > 0) {
        tags = tagValues;
      }
    }

    // Parse and validate sort field (prevent injection)
    let sortField: SortField = 'scheduled_start';
    const sortFieldParam = searchParams.get('sortField');
    if (sortFieldParam && VALID_SORT_FIELDS.includes(sortFieldParam as SortField)) {
      sortField = sortFieldParam as SortField;
    }

    // Parse sort direction
    const sortDirParam = searchParams.get('sortDir');
    const sortDir: 'asc' | 'desc' = sortDirParam === 'desc' ? 'desc' : 'asc';

    // Parse limit
    let limit = 20;
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit >= 1 && parsedLimit <= 100) {
        limit = parsedLimit;
      }
    }

    // Build filters object
    const filters: BookingListFilters = {
      captainId,
      startDate,
      endDate,
      status,
      paymentStatus,
      tags,
      vesselId,
      search,
      includeHistorical,
      sortField,
      sortDir,
      cursor,
      limit,
    };

    // Fetch bookings
    const result = await getBookingsWithFilters(filters);

    return NextResponse.json({
      bookings: result.bookings,
      nextCursor: result.nextCursor,
      totalCount: result.totalCount,
    });
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 *
 * Creates a new booking (public endpoint, no auth required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      captain_id,
      trip_type_id,
      guest_name,
      guest_email,
      guest_phone,
      party_size,
      scheduled_start,
      scheduled_end,
      special_requests,
      total_price_cents,
      deposit_paid_cents,
      balance_due_cents,
      referral_code,
      promo_code,
      promo_code_id,
      promo_discount_cents: clientPromoDiscountCents,
    } = body;

    // Validate required fields
    if (!captain_id || !trip_type_id || !guest_name || !guest_email || !party_size || !scheduled_start || !scheduled_end) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate party size
    if (party_size < 1 || party_size > 6) {
      return NextResponse.json(
        { error: 'Party size must be between 1 and 6' },
        { status: 400 }
      );
    }

    // Use service client (public endpoint)
    const supabase = createSupabaseServiceClient();

    // Fetch trip type and vessel details for conflict checking
    const { data: tripType, error: tripError } = await supabase
      .from('trip_types')
      .select('vessel_id')
      .eq('id', trip_type_id)
      .single();

    if (tripError || !tripType) {
      return NextResponse.json(
        { error: 'Trip type not found' },
        { status: 404 }
      );
    }

    // Fetch captain's booking buffer setting
    const { data: profile } = await supabase
      .from('profiles')
      .select('booking_buffer_minutes')
      .eq('id', captain_id)
      .single();

    const bufferMinutes = profile?.booking_buffer_minutes || 30;

    // Check for booking conflicts
    const conflictCheck = await checkAllConflicts({
      profileId: captain_id,
      vesselId: tripType.vessel_id,
      scheduledStart: new Date(scheduled_start),
      scheduledEnd: new Date(scheduled_end),
      bufferMinutes,
    });

    if (conflictCheck.hasConflict) {
      return NextResponse.json(
        {
          error: 'Booking conflict detected',
          reason: conflictCheck.reason,
          conflictingBookings: conflictCheck.conflictingBookings,
        },
        { status: 409 } // HTTP 409 Conflict
      );
    }

    // Handle referral code (if provided)
    let referralCodeData = null;
    let referralDiscountCents = 0;
    let referralSettings = null;
    
    if (referral_code && referral_code.trim()) {
      const codeUpper = referral_code.trim().toUpperCase();
      
      // Fetch referral code
      const { data: code } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('captain_id', captain_id)
        .eq('code', codeUpper)
        .eq('is_active', true)
        .single();
      
      if (code) {
        // Fetch referral settings
        const { data: settings } = await supabase
          .from('referral_settings')
          .select('*')
          .eq('captain_id', captain_id)
          .eq('is_enabled', true)
          .single();
        
        if (settings) {
          // Check minimum booking value
          if (total_price_cents >= settings.min_booking_value_cents) {
            // Calculate referee discount
            const { data: rewards } = await supabase.rpc('calculate_referral_rewards', {
              p_captain_id: captain_id,
              p_booking_value_cents: total_price_cents,
            });
            
            if (rewards && rewards.length > 0) {
              referralDiscountCents = rewards[0].referee_reward_cents;
              referralCodeData = code;
              referralSettings = settings;
            }
          }
        }
      }
    }

    // Handle promo code (if provided, and no referral code applied)
    let promoCodeData: { id: string; code: string; current_uses: number; total_discount_cents: number; total_booking_revenue_cents: number } | null = null;
    let promoDiscountCents = 0;

    if (promo_code && promo_code.trim() && referralDiscountCents === 0) {
      const promoUpper = promo_code.trim().toUpperCase();

      // Server-side validation of promo code
      const { data: rpcResult } = await supabase.rpc('validate_promo_code', {
        p_captain_id: captain_id,
        p_code: promoUpper,
        p_trip_type_id: trip_type_id,
        p_booking_value_cents: total_price_cents,
      });

      if (rpcResult && rpcResult.length > 0 && rpcResult[0].is_valid) {
        promoDiscountCents = rpcResult[0].discount_cents;
        // Fetch full promo code data for tracking
        const { data: pCode } = await supabase
          .from('promo_codes')
          .select('id, code, current_uses, total_discount_cents, total_booking_revenue_cents')
          .eq('id', rpcResult[0].promo_code_id)
          .single();
        if (pCode) promoCodeData = pCode;
      } else if (promo_code_id && clientPromoDiscountCents) {
        // Fallback: trust client-validated data if RPC is unavailable, but re-verify the code exists
        const { data: pCode } = await supabase
          .from('promo_codes')
          .select('id, code, current_uses, total_discount_cents, total_booking_revenue_cents, discount_type, discount_value, is_active, max_uses, valid_from, valid_to, trip_type_ids')
          .eq('id', promo_code_id)
          .eq('captain_id', captain_id)
          .eq('is_active', true)
          .single();

        if (pCode) {
          // Re-validate server-side
          const today = new Date().toISOString().split('T')[0];
          const dateOk = (!pCode.valid_from || today >= pCode.valid_from) && (!pCode.valid_to || today <= pCode.valid_to);
          const usageOk = pCode.max_uses === null || pCode.current_uses < pCode.max_uses;
          const tripOk = !pCode.trip_type_ids || pCode.trip_type_ids.length === 0 || pCode.trip_type_ids.includes(trip_type_id);

          if (dateOk && usageOk && tripOk) {
            if (pCode.discount_type === 'percentage') {
              promoDiscountCents = Math.floor(total_price_cents * pCode.discount_value / 100);
            } else {
              promoDiscountCents = Math.min(pCode.discount_value, total_price_cents);
            }
            promoCodeData = pCode;
          }
        }
      }
    }

    // Apply referral + promo discount to balance due
    const totalDiscount = referralDiscountCents + promoDiscountCents;
    const finalBalanceDue = Math.max(0, (balance_due_cents || total_price_cents || 0) - totalDiscount);

    // Create booking using safe insert function (optimistic locking via advisory lock)
    // This prevents double-booking race conditions at the database level
    let booking;
    const { data: safeResult, error: rpcError } = await supabase.rpc('insert_booking_safely', {
      p_captain_id: captain_id,
      p_trip_type_id: trip_type_id,
      p_vessel_id: tripType.vessel_id || null,
      p_guest_name: guest_name,
      p_guest_email: guest_email,
      p_guest_phone: guest_phone || null,
      p_party_size: party_size,
      p_scheduled_start: scheduled_start,
      p_scheduled_end: scheduled_end,
      p_special_requests: special_requests || null,
      p_status: 'pending_deposit',
      p_total_price_cents: total_price_cents || 0,
      p_deposit_paid_cents: deposit_paid_cents || 0,
      p_balance_due_cents: finalBalanceDue,
      p_internal_notes: null,
      p_tags: [],
      p_referral_code: referralCodeData?.code || null,
      p_referral_discount_cents: referralDiscountCents,
    });

    if (rpcError) {
      // Check if error is a slot conflict from the RPC function
      if (rpcError.message?.includes('SLOT_UNAVAILABLE')) {
        return NextResponse.json(
          { error: 'This time slot is no longer available', code: 'SLOT_UNAVAILABLE' },
          { status: 409 }
        );
      }

      // If RPC doesn't exist yet (migration not run), fall back to regular insert
      if (rpcError.message?.includes('function') || rpcError.code === '42883') {
        const { data: fallbackBooking, error: fallbackError } = await supabase
          .from('bookings')
          .insert({
            captain_id,
            trip_type_id,
            guest_name,
            guest_email,
            guest_phone: guest_phone || null,
            party_size,
            scheduled_start,
            scheduled_end,
            special_requests: special_requests || null,
            status: 'pending_deposit' as BookingStatus,
            payment_status: 'unpaid',
            total_price_cents: total_price_cents || 0,
            deposit_paid_cents: deposit_paid_cents || 0,
            balance_due_cents: finalBalanceDue,
            referral_code: referralCodeData?.code || null,
            referral_discount_cents: referralDiscountCents,
            promo_code_id: promoCodeData?.id || null,
            promo_discount_cents: promoDiscountCents,
          })
          .select()
          .single();

        if (fallbackError || !fallbackBooking) {
          // Check for exclusion constraint violation (overlap)
          if (fallbackError?.code === '23P01') {
            return NextResponse.json(
              { error: 'This time slot is no longer available', code: 'SLOT_UNAVAILABLE' },
              { status: 409 }
            );
          }
          console.error('Error creating booking:', fallbackError);
          return NextResponse.json(
            { error: 'Failed to create booking' },
            { status: 500 }
          );
        }
        booking = fallbackBooking;
      } else {
        console.error('Error creating booking via RPC:', rpcError);
        return NextResponse.json(
          { error: 'Failed to create booking' },
          { status: 500 }
        );
      }
    } else {
      // RPC returns the booking ID — fetch the full booking
      const bookingId = safeResult;
      const { data: fetchedBooking, error: fetchError } = await supabase
        .from('bookings')
        .select()
        .eq('id', bookingId)
        .single();

      if (fetchError || !fetchedBooking) {
        console.error('Error fetching created booking:', fetchError);
        return NextResponse.json(
          { error: 'Booking created but failed to retrieve details' },
          { status: 500 }
        );
      }
      booking = fetchedBooking;
    }

    // Generate secure guest token (for booking management)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = addMonths(new Date(), 6); // Token valid for 6 months

    const { error: tokenError } = await supabase
      .from('guest_tokens')
      .insert({
        booking_id: booking.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error('Error creating guest token:', tokenError);
      // Don't fail the booking creation, just log it
    }

    // Create primary passenger record
    const { error: passengerError } = await supabase
      .from('passengers')
      .insert({
        booking_id: booking.id,
        full_name: guest_name,
        email: guest_email,
        phone: guest_phone || null,
        is_primary_contact: true,
      });

    if (passengerError) {
      console.error('Error creating passenger:', passengerError);
      // Don't fail booking creation
    }

    // Create referral tracking record (if referral code was used)
    if (referralCodeData && referralSettings) {
      // Calculate rewards
      const { data: rewards } = await supabase.rpc('calculate_referral_rewards', {
        p_captain_id: captain_id,
        p_booking_value_cents: total_price_cents,
      });

      if (rewards && rewards.length > 0) {
        const { referrer_reward_cents, referee_reward_cents } = rewards[0];
        
        // Calculate expiry dates
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + referralSettings.reward_expiry_days);
        
        // Create referral record
        const { data: referral, error: referralError } = await supabase
          .from('referrals')
          .insert({
            captain_id,
            referral_code_id: referralCodeData.id,
            referrer_email: referralCodeData.guest_email,
            referrer_name: referralCodeData.guest_name,
            referee_email: guest_email,
            referee_name: guest_name,
            booking_id: booking.id,
            booking_value_cents: total_price_cents,
            referrer_reward_cents,
            referee_reward_cents,
            referrer_reward_applied: false,
            referee_reward_applied: true, // Applied immediately as discount
            referrer_reward_expires_at: expiresAt.toISOString(),
            referee_reward_expires_at: expiresAt.toISOString(),
            status: 'qualified',
          })
          .select()
          .single();

        if (!referralError && referral) {
          // Update booking with referral_id
          await supabase
            .from('bookings')
            .update({ referral_id: referral.id })
            .eq('id', booking.id);

          // Update referral code stats
          await supabase
            .from('referral_codes')
            .update({
              times_used: referralCodeData.times_used + 1,
              total_bookings_value_cents: referralCodeData.total_bookings_value_cents + total_price_cents,
              total_rewards_earned_cents: referralCodeData.total_rewards_earned_cents + referrer_reward_cents,
              updated_at: new Date().toISOString(),
            })
            .eq('id', referralCodeData.id);
        }
      }
    }

    // Update promo code tracking (if promo code was used)
    if (promoCodeData && promoDiscountCents > 0) {
      // Update booking with promo fields (in case RPC path was used and didn't include promo columns)
      await supabase
        .from('bookings')
        .update({
          promo_code_id: promoCodeData.id,
          promo_discount_cents: promoDiscountCents,
        })
        .eq('id', booking.id);

      // Update promo code usage stats
      await supabase
        .from('promo_codes')
        .update({
          current_uses: promoCodeData.current_uses + 1,
          total_discount_cents: (promoCodeData.total_discount_cents || 0) + promoDiscountCents,
          total_booking_revenue_cents: (promoCodeData.total_booking_revenue_cents || 0) + total_price_cents,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promoCodeData.id);
    }

    // Create booking log entry
    await supabase
      .from('booking_logs')
      .insert({
        booking_id: booking.id,
        entry_type: 'booking_created',
        description: `Booking created by ${guest_name}${promoCodeData ? ` with promo code ${promoCodeData.code}` : ''}`,
        actor_type: 'guest',
        new_value: { status: 'pending_deposit' },
      });

    // Send booking confirmation email (async, don't block response)
    if (process.env.RESEND_API_KEY) {
      // Fetch trip type, vessel, and profile details for email
      const { data: tripDetails } = await supabase
        .from('trip_types')
        .select('title, duration_hours')
        .eq('id', trip_type_id)
        .single();

      const { data: vesselDetails } = booking.vessel_id
        ? await supabase
            .from('vessels')
            .select('name')
            .eq('id', booking.vessel_id)
            .single()
        : { data: null };

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, full_name, meeting_spot_name')
        .eq('id', captain_id)
        .single();

      if (tripDetails && profile) {
        const managementUrl = `${request.nextUrl.origin}/manage/${token}`;
        
        sendBookingConfirmation({
          to: guest_email,
          guestName: guest_name,
          tripType: tripDetails.title,
          date: format(new Date(scheduled_start), 'EEEE, MMMM d, yyyy'),
          time: format(new Date(scheduled_start), 'h:mm a'),
          vessel: vesselDetails?.name || 'Your charter vessel',
          meetingSpot: profile.meeting_spot_name || 'Meeting spot details in booking',
          captainName: profile.business_name || profile.full_name || 'Your Captain',
          totalPrice: `$${((total_price_cents || 0) / 100).toFixed(2)}`,
          depositPaid: `$${((deposit_paid_cents || 0) / 100).toFixed(2)}`,
          balanceDue: `$${(finalBalanceDue / 100).toFixed(2)}`,
          managementUrl,
        }).catch(err => {
          console.error('Failed to send booking confirmation email:', err);
          // Don't fail the booking if email fails
        });
      }
    }

    return NextResponse.json({
      booking,
      managementUrl: `/manage/${token}`,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
