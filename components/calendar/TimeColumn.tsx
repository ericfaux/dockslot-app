'use client';

/**
 * TimeColumn - Displays hour labels on the left side of the calendar
 */

interface TimeColumnProps {
  startHour: number;
  endHour: number;
  pixelsPerHour: number;
}

export function TimeColumn({ startHour, endHour, pixelsPerHour }: TimeColumnProps) {
  const hours = [];
  for (let h = startHour; h <= endHour; h++) {
    hours.push(h);
  }

  const formatHour = (hour: number): string => {
    if (hour === 0 || hour === 24) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <div className="relative w-16 flex-shrink-0 border-r border-slate-700/50">
      {hours.map((hour, index) => (
        <div
          key={hour}
          className="absolute right-2 -translate-y-1/2"
          style={{ top: index * pixelsPerHour }}
        >
          <span className="font-mono text-[10px] text-slate-500">
            {formatHour(hour)}
          </span>
        </div>
      ))}
    </div>
  );
}
