'use client';

import { useState, useCallback } from 'react';
import { Calendar, CalendarBooking, STATUS_COLORS, STATUS_LABELS } from '@/components/calendar';
import { BookingDetailPanel } from './BookingDetailPanel';

interface ScheduleClientProps {
  captainId: string;
}

/**
 * ScheduleClient - Client-side wrapper for schedule functionality
 * Manages calendar state and booking detail panel
 */

export function ScheduleClient({ captainId }: ScheduleClientProps) {
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleBlockClick = useCallback((booking: CalendarBooking) => {
    setSelectedBooking(booking);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    // Delay clearing the booking to allow animation
    setTimeout(() => setSelectedBooking(null), 300);
  }, []);

  const handleBookingUpdated = useCallback(() => {
    // The calendar will refetch on its own when date changes
    // For immediate refresh, we could add a refresh callback
    handleClosePanel();
  }, [handleClosePanel]);

  return (
    <div className="relative h-full">
      {/* Calendar */}
      <Calendar
        captainId={captainId}
        onBlockClick={handleBlockClick}
      />

      {/* Booking Detail Panel (slide-over) */}
      <BookingDetailPanel
        booking={selectedBooking}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onUpdated={handleBookingUpdated}
      />
    </div>
  );
}
