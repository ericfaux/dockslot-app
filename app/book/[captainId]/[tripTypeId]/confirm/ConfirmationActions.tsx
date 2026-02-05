// app/book/[captainId]/[tripTypeId]/confirm/ConfirmationActions.tsx
// Client component for calendar and share actions on confirmation page

'use client';

import { AddToCalendarButton } from '@/components/booking/AddToCalendarButton';
import { ShareBookingButton } from '@/components/booking/ShareBookingButton';

interface ConfirmationActionsProps {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  shareText: string;
  className?: string;
}

export function ConfirmationActions({
  title,
  description,
  location,
  startTime,
  endTime,
  shareText,
  className = '',
}: ConfirmationActionsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${className}`}>
      <AddToCalendarButton
        title={title}
        description={description}
        location={location}
        startTime={startTime}
        endTime={endTime}
      />
      <ShareBookingButton
        title="My Charter Booking"
        text={shareText}
      />
    </div>
  );
}
