'use client';

import { useState, useEffect } from 'react';
import { X, Compass, CalendarDays, Users, BarChart3, Settings } from 'lucide-react';

const STORAGE_KEY = 'dockslot_welcome_dismissed';

export function WelcomeBanner() {
  const [isDismissed, setIsDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      setIsDismissed(false);
    }
  }, []);

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const sections = [
    { icon: CalendarDays, label: 'Schedule', desc: 'Your calendar and bookings at a glance' },
    { icon: Users, label: 'Guests', desc: 'Track repeat customers and relationships' },
    { icon: BarChart3, label: 'Reports', desc: 'Revenue analytics and season performance' },
    { icon: Settings, label: 'Settings', desc: 'Trip types, vessels, waivers, and more' },
  ];

  return (
    <div className="rounded-lg border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100">
            <Compass className="h-5 w-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Welcome to DockSlot</h3>
            <p className="text-sm text-slate-500">Here's what you'll find on your dashboard</p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          aria-label="Dismiss welcome banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {sections.map((section) => (
          <div key={section.label} className="rounded-lg bg-white border border-slate-100 p-3">
            <section.icon className="h-4 w-4 text-cyan-600 mb-1.5" />
            <p className="text-sm font-medium text-slate-700">{section.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{section.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
