'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PromoCode, PromoCodeStats } from '@/lib/db/types';

// ============================================================================
// Types
// ============================================================================

interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreatePromoCodeParams {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  valid_from?: string | null;
  valid_to?: string | null;
  max_uses?: number | null;
  trip_type_ids?: string[];
  is_active?: boolean;
}

export interface UpdatePromoCodeParams {
  id: string;
  code?: string;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  valid_from?: string | null;
  valid_to?: string | null;
  max_uses?: number | null;
  trip_type_ids?: string[];
  is_active?: boolean;
}

// ============================================================================
// Create Promo Code
// ============================================================================

export async function createPromoCode(params: CreatePromoCodeParams): Promise<ActionResult<PromoCode>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Validate code format
    const code = params.code.trim().toUpperCase();
    if (!code || code.length < 2 || code.length > 30) {
      return { success: false, error: 'Code must be between 2 and 30 characters' };
    }
    if (!/^[A-Z0-9_-]+$/.test(code)) {
      return { success: false, error: 'Code can only contain letters, numbers, hyphens, and underscores' };
    }

    // Validate discount
    if (params.discount_type === 'percentage') {
      if (params.discount_value < 1 || params.discount_value > 100) {
        return { success: false, error: 'Percentage discount must be between 1 and 100' };
      }
    } else {
      if (params.discount_value < 1) {
        return { success: false, error: 'Fixed discount must be at least 1 cent' };
      }
    }

    // Validate date range
    if (params.valid_from && params.valid_to && params.valid_from > params.valid_to) {
      return { success: false, error: 'End date must be after start date' };
    }

    // Validate max uses
    if (params.max_uses !== undefined && params.max_uses !== null && params.max_uses < 1) {
      return { success: false, error: 'Usage limit must be at least 1' };
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .insert({
        captain_id: user.id,
        code,
        discount_type: params.discount_type,
        discount_value: params.discount_value,
        valid_from: params.valid_from || null,
        valid_to: params.valid_to || null,
        max_uses: params.max_uses ?? null,
        trip_type_ids: params.trip_type_ids || [],
        is_active: params.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A promo code with this name already exists' };
      }
      console.error('Error creating promo code:', error);
      return { success: false, error: 'Failed to create promo code' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createPromoCode:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Update Promo Code
// ============================================================================

export async function updatePromoCode(params: UpdatePromoCodeParams): Promise<ActionResult<PromoCode>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (params.code !== undefined) {
      const code = params.code.trim().toUpperCase();
      if (!code || code.length < 2 || code.length > 30) {
        return { success: false, error: 'Code must be between 2 and 30 characters' };
      }
      if (!/^[A-Z0-9_-]+$/.test(code)) {
        return { success: false, error: 'Code can only contain letters, numbers, hyphens, and underscores' };
      }
      updateData.code = code;
    }

    if (params.discount_type !== undefined) {
      updateData.discount_type = params.discount_type;
    }

    if (params.discount_value !== undefined) {
      const type = params.discount_type || 'percentage';
      if (type === 'percentage' && (params.discount_value < 1 || params.discount_value > 100)) {
        return { success: false, error: 'Percentage discount must be between 1 and 100' };
      }
      if (params.discount_value < 1) {
        return { success: false, error: 'Discount value must be at least 1' };
      }
      updateData.discount_value = params.discount_value;
    }

    if (params.valid_from !== undefined) updateData.valid_from = params.valid_from;
    if (params.valid_to !== undefined) updateData.valid_to = params.valid_to;
    if (params.max_uses !== undefined) updateData.max_uses = params.max_uses;
    if (params.trip_type_ids !== undefined) updateData.trip_type_ids = params.trip_type_ids;
    if (params.is_active !== undefined) updateData.is_active = params.is_active;

    const { data, error } = await supabase
      .from('promo_codes')
      .update(updateData)
      .eq('id', params.id)
      .eq('captain_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A promo code with this name already exists' };
      }
      console.error('Error updating promo code:', error);
      return { success: false, error: 'Failed to update promo code' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updatePromoCode:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Delete Promo Code
// ============================================================================

export async function deletePromoCode(id: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if code has been used
    const { data: promoCode } = await supabase
      .from('promo_codes')
      .select('current_uses')
      .eq('id', id)
      .eq('captain_id', user.id)
      .single();

    if (promoCode && promoCode.current_uses > 0) {
      return { success: false, error: 'Cannot delete a promo code that has been used. Deactivate it instead.' };
    }

    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id)
      .eq('captain_id', user.id);

    if (error) {
      console.error('Error deleting promo code:', error);
      return { success: false, error: 'Failed to delete promo code' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deletePromoCode:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Toggle Promo Code Active Status
// ============================================================================

export async function togglePromoCode(id: string): Promise<ActionResult<PromoCode>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get current status
    const { data: current } = await supabase
      .from('promo_codes')
      .select('is_active')
      .eq('id', id)
      .eq('captain_id', user.id)
      .single();

    if (!current) {
      return { success: false, error: 'Promo code not found' };
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .update({
        is_active: !current.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('captain_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling promo code:', error);
      return { success: false, error: 'Failed to toggle promo code' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in togglePromoCode:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Get All Promo Codes for Captain
// ============================================================================

export async function getPromoCodes(): Promise<ActionResult<PromoCode[]>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('captain_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching promo codes:', error);
      return { success: false, error: 'Failed to fetch promo codes' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getPromoCodes:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================================================
// Get Promo Code Stats
// ============================================================================

export async function getPromoCodeStats(): Promise<ActionResult<PromoCodeStats>> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase.rpc('get_promo_code_stats', {
      p_captain_id: user.id,
    });

    if (error) {
      // Fallback if RPC not available yet
      const { data: codes } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('captain_id', user.id);

      const allCodes = codes || [];
      return {
        success: true,
        data: {
          total_codes: allCodes.length,
          active_codes: allCodes.filter(c => c.is_active).length,
          total_uses: allCodes.reduce((sum, c) => sum + c.current_uses, 0),
          total_discount_given_cents: allCodes.reduce((sum, c) => sum + (c.total_discount_cents || 0), 0),
          total_revenue_from_promos_cents: allCodes.reduce((sum, c) => sum + (c.total_booking_revenue_cents || 0), 0),
          top_codes: allCodes
            .sort((a, b) => b.current_uses - a.current_uses)
            .slice(0, 10)
            .map(c => ({
              id: c.id,
              code: c.code,
              discount_type: c.discount_type,
              discount_value: c.discount_value,
              current_uses: c.current_uses,
              max_uses: c.max_uses,
              total_discount_cents: c.total_discount_cents || 0,
              total_booking_revenue_cents: c.total_booking_revenue_cents || 0,
              is_active: c.is_active,
              valid_from: c.valid_from,
              valid_to: c.valid_to,
            })),
        },
      };
    }

    if (data && data.length > 0) {
      return { success: true, data: data[0] };
    }

    return {
      success: true,
      data: {
        total_codes: 0,
        active_codes: 0,
        total_uses: 0,
        total_discount_given_cents: 0,
        total_revenue_from_promos_cents: 0,
        top_codes: [],
      },
    };
  } catch (error) {
    console.error('Error in getPromoCodeStats:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
