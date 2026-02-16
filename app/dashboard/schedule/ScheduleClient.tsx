'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, setHours, setMinutes } from 'date-fns';
import { Calendar, CalendarBooking, CalendarView, BlackoutDate, STATUS_COLORS, STATUS_LABELS } from '@/components/calendar';
import { BookingDetailPanel } from './BookingDetailPanel';
import { BlackoutModal } from './BlackoutModal';
import { UnblockConfirmModal } from './UnblockConfirmModal';
import { QuickBookingModal } from './QuickBookingModal';
import { createBlackoutDate, createBlackoutDateRange, deleteBlackoutDate } from '@/app/actions/blackout';
import { quickCreateBooking } from '@/app/actions/bookings';
import { useSubscription } from '@/lib/subscription/context';
import { canUseFeature } from '@/lib/subscription/gates';
import { GatedButton } from '@/components/GatedButton';
import { UpgradeModal } from '@/components/UpgradeModal';

interface ScheduleClientProps {
  captainId: string;
  timezone?: string;
  isHibernating?: boolean;
  hibernationEndDate?: string | null;
  availabilityStartHour?: number;
  availabilityEndHour?: number;
}

/**
 * ScheduleClient - Client-side wrapper for schedule functionality
 * Manages calendar state and booking detail panel
 */

export function ScheduleClient({ captainId, timezone, isHibernating, hibernationEndDate, availabilityStartHour, availabilityEndHour }: ScheduleClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tier } = useSubscription();
  const isDeckhand = tier === 'deckhand';
  const canUseDayView = canUseFeature(tier, 'day_calendar_view');
  const [showDayViewUpgrade, setShowDayViewUpgrade] = useState(false);

  // Force week view for deckhand users (day view is a Captain feature)
  const initialView: CalendarView = (!canUseDayView || searchParams.get('view') !== 'day') ? 'week' : 'day';
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Blackout modal state
  const [isBlackoutModalOpen, setIsBlackoutModalOpen] = useState(false);
  const [selectedBlackout, setSelectedBlackout] = useState<BlackoutDate | null>(null);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  // Quick booking modal state
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [quickBookingSlot, setQuickBookingSlot] = useState<{ date: Date; hour: number } | null>(null);

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

  // Blackout handlers
  const handleQuickBlockClick = useCallback(() => {
    setIsBlackoutModalOpen(true);
  }, []);

  const handleBlackoutClick = useCallback((blackout: BlackoutDate) => {
    setSelectedBlackout(blackout);
    setIsUnblockModalOpen(true);
  }, []);

  const handleCloseBlackoutModal = useCallback(() => {
    setIsBlackoutModalOpen(false);
  }, []);

  const handleCloseUnblockModal = useCallback(() => {
    setIsUnblockModalOpen(false);
    setTimeout(() => setSelectedBlackout(null), 300);
  }, []);

  const handleCreateBlackout = useCallback(async (startDate: Date, endDate: Date | null, reason?: string) => {
    startTransition(async () => {
      let result;
      if (endDate) {
        result = await createBlackoutDateRange(captainId, startDate, endDate, reason);
      } else {
        result = await createBlackoutDate(captainId, startDate, reason);
      }

      if (result.success) {
        setIsBlackoutModalOpen(false);
        setRefreshKey((k) => k + 1);
      } else {
        // Error is handled by the modal through the isPending state
        console.error('Failed to create blackout:', result.error);
      }
    });
  }, [captainId]);

  const handleDeleteBlackout = useCallback(async () => {
    if (!selectedBlackout) return;

    startTransition(async () => {
      const result = await deleteBlackoutDate(selectedBlackout.id);

      if (result.success) {
        setIsUnblockModalOpen(false);
        setSelectedBlackout(null);
        setRefreshKey((k) => k + 1);
      } else {
        console.error('Failed to delete blackout:', result.error);
      }
    });
  }, [selectedBlackout]);

  // View change handler - persists view in URL
  // Deckhand users are blocked from switching to day view
  const handleViewChange = useCallback((view: CalendarView) => {
    if (view === 'day' && !canUseDayView) {
      setShowDayViewUpgrade(true);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('view', view);
    window.history.replaceState({}, '', url.toString());
  }, [canUseDayView]);

  // Empty slot click handler - opens quick booking modal
  const handleEmptySlotClick = useCallback((date: Date, hour: number) => {
    setQuickBookingSlot({ date, hour });
    setIsQuickBookingOpen(true);
  }, []);

  const handleCloseQuickBooking = useCallback(() => {
    setIsQuickBookingOpen(false);
    setTimeout(() => setQuickBookingSlot(null), 300);
  }, []);

  const handleCreateManualBooking = useCallback(() => {
    if (!quickBookingSlot) return;
    const startTime = setMinutes(setHours(quickBookingSlot.date, quickBookingSlot.hour), 0);
    router.push(`/dashboard/bookings/new?date=${format(startTime, 'yyyy-MM-dd')}&time=${format(startTime, 'HH:mm')}`);
    setIsQuickBookingOpen(false);
  }, [quickBookingSlot, router]);

  const handleQuickCreate = useCallback(async (data: {
    guestName: string;
    guestPhone: string;
    partySize: number;
    source: 'walk_up' | 'phone' | 'other';
    date: Date;
    hour: number;
  }) => {
    const startTime = setMinutes(setHours(data.date, data.hour), 0);
    const endTime = new Date(startTime.getTime() + 4 * 60 * 60 * 1000); // Default 4-hour trip

    const result = await quickCreateBooking({
      captain_id: captainId,
      guest_name: data.guestName,
      guest_phone: data.guestPhone || undefined,
      party_size: data.partySize,
      scheduled_start: startTime.toISOString(),
      scheduled_end: endTime.toISOString(),
      source: data.source,
    });

    if (result.success) {
      setRefreshKey((k) => k + 1);
    } else {
      throw new Error(result.error || 'Failed to create booking');
    }
  }, [captainId]);

  return (
    <div className="relative h-full">
      {/* Calendar */}
      <Calendar
        captainId={captainId}
        timezone={timezone}
        initialView={initialView}
        onViewChange={handleViewChange}
        onBlockClick={handleBlockClick}
        onQuickBlockClick={handleQuickBlockClick}
        onBlackoutClick={handleBlackoutClick}
        onEmptySlotClick={handleEmptySlotClick}
        refreshKey={refreshKey}
        availabilityStartHour={availabilityStartHour}
        availabilityEndHour={availabilityEndHour}
        dayViewLocked={!canUseDayView}
      />

      {/* Booking Detail Panel (slide-over) */}
      <BookingDetailPanel
        booking={selectedBooking}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onUpdated={handleBookingUpdated}
      />

      {/* Blackout Modal */}
      <BlackoutModal
        isOpen={isBlackoutModalOpen}
        onClose={handleCloseBlackoutModal}
        onSubmit={handleCreateBlackout}
        isPending={isPending}
      />

      {/* Unblock Confirmation Modal */}
      <UnblockConfirmModal
        blackout={selectedBlackout}
        isOpen={isUnblockModalOpen}
        onClose={handleCloseUnblockModal}
        onConfirm={handleDeleteBlackout}
        isPending={isPending}
      />

      {/* Quick Booking Modal */}
      <QuickBookingModal
        isOpen={isQuickBookingOpen}
        slot={quickBookingSlot}
        onClose={handleCloseQuickBooking}
        onCreateBooking={handleCreateManualBooking}
        onQuickCreate={handleQuickCreate}
      />

      {/* Day View Upgrade Modal */}
      <UpgradeModal
        isOpen={showDayViewUpgrade}
        onClose={() => setShowDayViewUpgrade(false)}
        feature="day_calendar_view"
      />
    </div>
  );
}
