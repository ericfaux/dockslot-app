'use client';

import { useEffect, useState } from 'react';

/**
 * NowIndicator - Shows current time line on the calendar
 */

interface NowIndicatorProps {
  startHour: number;
  pixelsPerHour: number;
}

export function NowIndicator({ startHour, pixelsPerHour }: NowIndicatorProps) {
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const currentHour = now.getHours() + now.getMinutes() / 60;
      const hoursFromStart = currentHour - startHour;

      if (hoursFromStart >= 0) {
        setPosition(hoursFromStart * pixelsPerHour);
      } else {
        setPosition(null);
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startHour, pixelsPerHour]);

  if (position === null) return null;

  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-20 flex items-center"
      style={{ top: position }}
    >
      {/* Glowing dot */}
      <div
        className="h-3 w-3 rounded-full bg-amber-400"
        style={{
          boxShadow: '0 0 8px rgba(251, 191, 36, 0.8), 0 0 16px rgba(251, 191, 36, 0.4)',
        }}
      />
      {/* Line */}
      <div
        className="h-0.5 flex-1 bg-amber-400"
        style={{
          boxShadow: '0 0 4px rgba(251, 191, 36, 0.6)',
        }}
      />
    </div>
  );
}
