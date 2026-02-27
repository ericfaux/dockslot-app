'use client';

interface BookingCountBannerProps {
  count?: number;
  limit?: number;
}

/**
 * BookingCountBanner - Previously showed booking limit usage for free tier.
 * Now a no-op since all users have unlimited bookings.
 */
export function BookingCountBanner(_props: BookingCountBannerProps) {
  return null;
}
