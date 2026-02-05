// components/booking/AddToCalendarButton.tsx
// Generates .ics file for adding booking to calendar
// Supports major calendar apps (Google, Apple, Outlook)

'use client';

import { Calendar, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface AddToCalendarButtonProps {
  title: string;
  description?: string;
  location?: string;
  startTime: string; // ISO 8601 format
  endTime: string;   // ISO 8601 format
  className?: string;
}

export function AddToCalendarButton({
  title,
  description = '',
  location = '',
  startTime,
  endTime,
  className = '',
}: AddToCalendarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for .ics file (YYYYMMDDTHHMMSSZ)
  const formatICSDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  // Format date for Google Calendar
  const formatGoogleDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
  };

  // Generate .ics file content
  const generateICS = (): string => {
    const icsStart = formatICSDate(startTime);
    const icsEnd = formatICSDate(endTime);
    const uid = `dockslot-${Date.now()}@dockslot.com`;

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//DockSlot//Booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${icsStart}`,
      `DTEND:${icsEnd}`,
      `SUMMARY:${escapeICSText(title)}`,
      description ? `DESCRIPTION:${escapeICSText(description)}` : '',
      location ? `LOCATION:${escapeICSText(location)}` : '',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    return ics;
  };

  // Escape special characters for ICS format
  const escapeICSText = (text: string): string => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  // Download .ics file
  const downloadICS = () => {
    const icsContent = generateICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsOpen(false);
  };

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = (): string => {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${formatGoogleDate(startTime)}/${formatGoogleDate(endTime)}`,
      details: description,
      location: location,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate Outlook Web URL
  const getOutlookUrl = (): string => {
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: title,
      startdt: startTime,
      enddt: endTime,
      body: description,
      location: location,
    });

    return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
  };

  const calendarOptions = [
    {
      label: 'Apple Calendar',
      icon: '🍎',
      action: downloadICS,
    },
    {
      label: 'Google Calendar',
      icon: '📅',
      action: () => {
        window.open(getGoogleCalendarUrl(), '_blank');
        setIsOpen(false);
      },
    },
    {
      label: 'Outlook',
      icon: '📧',
      action: () => {
        window.open(getOutlookUrl(), '_blank');
        setIsOpen(false);
      },
    },
    {
      label: 'Download .ics',
      icon: '⬇️',
      action: downloadICS,
    },
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center justify-center gap-2 w-full
          rounded-lg border border-slate-600 bg-slate-800
          px-4 py-3 text-sm font-medium text-slate-100
          transition-colors hover:bg-slate-700
          min-h-[48px]
        "
      >
        <Calendar className="h-4 w-4 text-cyan-400" />
        <span>Add to Calendar</span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 right-0 z-10 mt-2
            rounded-lg border border-slate-700 bg-slate-800
            shadow-xl shadow-black/30
            overflow-hidden
          "
        >
          {calendarOptions.map((option, index) => (
            <button
              key={index}
              onClick={option.action}
              className="
                flex items-center gap-3 w-full px-4 py-3
                text-sm text-slate-100 text-left
                transition-colors hover:bg-slate-700
                border-b border-slate-700 last:border-b-0
                min-h-[48px]
              "
            >
              <span className="text-lg">{option.icon}</span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
