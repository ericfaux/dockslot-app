/**
 * Shared price formatting utilities for DockSlot
 *
 * IMPORTANT: trip_types fields (price_total, deposit_amount) are stored in
 * whole DOLLARS. Use formatDollars() for these.
 *
 * Bookings fields (total_price_cents, deposit_paid_cents, balance_due_cents)
 * are stored in CENTS. Use formatCents() for these.
 */

/**
 * Format a whole-dollar amount for display.
 * Use for: trip_types.price_total, trip_types.deposit_amount
 */
export function formatDollars(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a cents amount for display (divides by 100).
 * Use for: bookings.total_price_cents, bookings.deposit_paid_cents,
 *          bookings.balance_due_cents, promo_discount_cents, etc.
 */
export function formatCents(amountCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}
