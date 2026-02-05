'use server';

/**
 * DockSlot Hibernation Subscriber Actions
 * Handles email subscriptions for "We're Back!" notifications
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/utils/supabase/service';
import { HibernationSubscriber } from '@/lib/db/types';
import { isValidEmail, isValidUUID, sanitizeName } from '@/lib/utils/validation';

// ============================================================================
// Types
// ============================================================================

export type ErrorCode =
  | 'VALIDATION'
  | 'NOT_FOUND'
  | 'ALREADY_SUBSCRIBED'
  | 'NOT_HIBERNATING'
  | 'NOTIFICATIONS_DISABLED'
  | 'DATABASE';

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: ErrorCode;
}

// ============================================================================
// Public Actions (for guests)
// ============================================================================

/**
 * Subscribe to hibernation end notifications (public action for guests)
 */
export async function subscribeToHibernationNotifications(
  captainId: string,
  email: string,
  name?: string | null
): Promise<ActionResult<{ subscribed: boolean }>> {
  // Validate inputs
  if (!isValidUUID(captainId)) {
    return { success: false, error: 'Invalid captain ID', code: 'VALIDATION' };
  }

  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Invalid email address', code: 'VALIDATION' };
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedName = name ? sanitizeName(name) : null;

  // Use service client for public action
  const supabase = createSupabaseServiceClient();

  // Check if captain exists, is hibernating, and allows notifications
  const { data: captain, error: captainError } = await supabase
    .from('profiles')
    .select('id, is_hibernating, hibernation_allow_notifications, business_name')
    .eq('id', captainId)
    .single();

  if (captainError || !captain) {
    return { success: false, error: 'Captain not found', code: 'NOT_FOUND' };
  }

  if (!captain.is_hibernating) {
    return {
      success: false,
      error: 'This captain is currently accepting bookings',
      code: 'NOT_HIBERNATING'
    };
  }

  if (!captain.hibernation_allow_notifications) {
    return {
      success: false,
      error: 'Notifications are not enabled for this captain',
      code: 'NOTIFICATIONS_DISABLED'
    };
  }

  // Check if already subscribed (and not unsubscribed)
  const { data: existing } = await supabase
    .from('hibernation_subscribers')
    .select('id, unsubscribed_at, name')
    .eq('captain_id', captainId)
    .eq('email', sanitizedEmail)
    .single();

  if (existing && !existing.unsubscribed_at) {
    return {
      success: false,
      error: 'Already subscribed to notifications',
      code: 'ALREADY_SUBSCRIBED'
    };
  }

  // If previously unsubscribed, resubscribe
  if (existing) {
    const { error: updateError } = await supabase
      .from('hibernation_subscribers')
      .update({
        unsubscribed_at: null,
        subscribed_at: new Date().toISOString(),
        name: sanitizedName || existing.name
      })
      .eq('id', existing.id);

    if (updateError) {
      console.error('Error resubscribing:', updateError);
      return { success: false, error: 'Failed to subscribe', code: 'DATABASE' };
    }

    return { success: true, data: { subscribed: true } };
  }

  // Create new subscription
  const { error: insertError } = await supabase
    .from('hibernation_subscribers')
    .insert({
      captain_id: captainId,
      email: sanitizedEmail,
      name: sanitizedName,
      subscribed_at: new Date().toISOString(),
    });

  if (insertError) {
    console.error('Error subscribing:', insertError);
    return { success: false, error: 'Failed to subscribe', code: 'DATABASE' };
  }

  return { success: true, data: { subscribed: true } };
}

// ============================================================================
// Captain Actions (authenticated)
// ============================================================================

/**
 * Get all subscribers for the current captain
 */
export async function getHibernationSubscribers(): Promise<ActionResult<HibernationSubscriber[]>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'VALIDATION' };
  }

  const { data, error } = await supabase
    .from('hibernation_subscribers')
    .select('*')
    .eq('captain_id', user.id)
    .is('unsubscribed_at', null)
    .order('subscribed_at', { ascending: false });

  if (error) {
    console.error('Error fetching subscribers:', error);
    return { success: false, error: 'Failed to fetch subscribers', code: 'DATABASE' };
  }

  return { success: true, data: data as HibernationSubscriber[] };
}

/**
 * Get subscriber count for the current captain
 */
export async function getHibernationSubscriberCount(): Promise<ActionResult<number>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'VALIDATION' };
  }

  const { count, error } = await supabase
    .from('hibernation_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('captain_id', user.id)
    .is('unsubscribed_at', null);

  if (error) {
    console.error('Error counting subscribers:', error);
    return { success: false, error: 'Failed to count subscribers', code: 'DATABASE' };
  }

  return { success: true, data: count || 0 };
}

/**
 * Delete a subscriber (captain action)
 */
export async function deleteHibernationSubscriber(
  subscriberId: string
): Promise<ActionResult<{ deleted: boolean }>> {
  if (!isValidUUID(subscriberId)) {
    return { success: false, error: 'Invalid subscriber ID', code: 'VALIDATION' };
  }

  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'VALIDATION' };
  }

  // Only delete if it belongs to the current captain
  const { error } = await supabase
    .from('hibernation_subscribers')
    .delete()
    .eq('id', subscriberId)
    .eq('captain_id', user.id);

  if (error) {
    console.error('Error deleting subscriber:', error);
    return { success: false, error: 'Failed to delete subscriber', code: 'DATABASE' };
  }

  return { success: true, data: { deleted: true } };
}

/**
 * Mark subscribers as notified (called when hibernation ends)
 */
export async function markSubscribersNotified(
  captainId: string
): Promise<ActionResult<number>> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from('hibernation_subscribers')
    .update({ notified_at: new Date().toISOString() })
    .eq('captain_id', captainId)
    .is('unsubscribed_at', null)
    .is('notified_at', null)
    .select();

  if (error) {
    console.error('Error marking subscribers as notified:', error);
    return { success: false, error: 'Failed to mark subscribers as notified', code: 'DATABASE' };
  }

  return { success: true, data: data?.length || 0 };
}

/**
 * Export subscribers as CSV (captain action)
 */
export async function exportHibernationSubscribers(): Promise<ActionResult<string>> {
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'Not authenticated', code: 'VALIDATION' };
  }

  const { data, error } = await supabase
    .from('hibernation_subscribers')
    .select('email, name, subscribed_at')
    .eq('captain_id', user.id)
    .is('unsubscribed_at', null)
    .order('subscribed_at', { ascending: false });

  if (error) {
    console.error('Error exporting subscribers:', error);
    return { success: false, error: 'Failed to export subscribers', code: 'DATABASE' };
  }

  // Generate CSV
  const headers = 'Email,Name,Subscribed At\n';
  const rows = (data || []).map(sub =>
    `${sub.email},"${sub.name || ''}",${sub.subscribed_at}`
  ).join('\n');

  return { success: true, data: headers + rows };
}
