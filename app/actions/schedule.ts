'use server';

import { createSupabaseServerClient } from '@/utils/supabase/server';

export interface BlackoutDateActionResult {
  success: boolean;
  error?: string;
}

/**
 * Create a blackout date range
 */
export async function createBlackoutDate(
  startDate: string,
  endDate: string,
  reason?: string
): Promise<BlackoutDateActionResult> {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase.from('blackout_dates').insert({
    captain_id: user.id,
    start_date: startDate,
    end_date: endDate,
    reason: reason || null,
  });

  if (error) {
    console.error('Failed to create blackout date:', error);
    return { success: false, error: 'Failed to block dates' };
  }

  return { success: true };
}

/**
 * Delete a blackout date
 */
export async function deleteBlackoutDate(id: string): Promise<BlackoutDateActionResult> {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('blackout_dates')
    .delete()
    .eq('id', id)
    .eq('captain_id', user.id);

  if (error) {
    console.error('Failed to delete blackout date:', error);
    return { success: false, error: 'Failed to remove blackout date' };
  }

  return { success: true };
}
