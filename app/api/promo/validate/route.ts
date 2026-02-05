import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';

/**
 * POST /api/promo/validate
 *
 * Public endpoint that validates a promo code and returns discount info.
 * Used by the guest booking flow to show real-time discount preview.
 *
 * Body: { captain_id, code, trip_type_id, total_price_cents }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { captain_id, code, trip_type_id, total_price_cents } = body;

    if (!captain_id || !code || !trip_type_id || !total_price_cents) {
      return NextResponse.json(
        { error: 'Missing required fields: captain_id, code, trip_type_id, total_price_cents' },
        { status: 400 }
      );
    }

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      return NextResponse.json(
        { is_valid: false, error_message: 'Please enter a promo code' },
        { status: 200 }
      );
    }

    const supabase = createSupabaseServiceClient();

    // Try RPC first
    const { data: rpcResult, error: rpcError } = await supabase.rpc('validate_promo_code', {
      p_captain_id: captain_id,
      p_code: trimmedCode,
      p_trip_type_id: trip_type_id,
      p_booking_value_cents: total_price_cents,
    });

    if (!rpcError && rpcResult && rpcResult.length > 0) {
      const result = rpcResult[0];
      if (result.is_valid) {
        return NextResponse.json({
          is_valid: true,
          promo_code_id: result.promo_code_id,
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          discount_cents: result.discount_cents,
        });
      } else {
        return NextResponse.json({
          is_valid: false,
          error_message: result.error_message,
        });
      }
    }

    // Fallback: manual validation if RPC not available
    const { data: promoCode } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('captain_id', captain_id)
      .ilike('code', trimmedCode)
      .eq('is_active', true)
      .single();

    if (!promoCode) {
      return NextResponse.json({
        is_valid: false,
        error_message: 'Invalid promo code',
      });
    }

    // Check date range
    const today = new Date().toISOString().split('T')[0];
    if (promoCode.valid_from && today < promoCode.valid_from) {
      return NextResponse.json({
        is_valid: false,
        error_message: 'This promo code is not yet active',
      });
    }
    if (promoCode.valid_to && today > promoCode.valid_to) {
      return NextResponse.json({
        is_valid: false,
        error_message: 'This promo code has expired',
      });
    }

    // Check usage limit
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json({
        is_valid: false,
        error_message: 'This promo code has reached its usage limit',
      });
    }

    // Check trip type applicability
    if (promoCode.trip_type_ids && promoCode.trip_type_ids.length > 0 && !promoCode.trip_type_ids.includes(trip_type_id)) {
      return NextResponse.json({
        is_valid: false,
        error_message: 'This promo code does not apply to this trip type',
      });
    }

    // Calculate discount
    let discountCents: number;
    if (promoCode.discount_type === 'percentage') {
      discountCents = Math.floor(total_price_cents * promoCode.discount_value / 100);
    } else {
      discountCents = Math.min(promoCode.discount_value, total_price_cents);
    }

    return NextResponse.json({
      is_valid: true,
      promo_code_id: promoCode.id,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      discount_cents: discountCents,
    });
  } catch (error) {
    console.error('Error in POST /api/promo/validate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
