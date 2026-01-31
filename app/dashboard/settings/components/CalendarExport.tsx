'use client';

import { useState } from 'react';
import { Calendar, Copy, Check, RefreshCw, ExternalLink } from 'lucide-react';

interface Props {
  calendarToken: string;
  onRegenerate: () => Promise<void>;
}

export function CalendarExport({ calendarToken, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const calendarUrl = `${window.location.origin}/api/calendar/export?token=${calendarToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(calendarUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerate calendar token? This will invalidate your existing calendar subscriptions.')) {
      return;
    }

    setRegenerating(true);
    try {
      await onRegenerate();
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Calendar Export</h3>
        <p className="mt-1 text-sm text-slate-400">
          Subscribe to your bookings in Apple Calendar, Google Calendar, Outlook, or any calendar app
        </p>
      </div>

      {/* Calendar URL */}
      <div>
        <label className="block text-sm font-medium text-slate-300">
          Calendar Subscription URL
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={calendarUrl}
            readOnly
            className="flex-1 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 font-mono text-sm text-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy
              </>
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          This URL is private. Anyone with this link can view your bookings.
        </p>
      </div>

      {/* Setup Instructions */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h4 className="mb-4 font-semibold text-white">How to Subscribe</h4>

        <div className="space-y-4">
          {/* Apple Calendar */}
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <p className="font-medium text-white">Apple Calendar (iPhone, Mac)</p>
            </div>
            <ol className="mt-2 space-y-1 pl-6 text-sm text-slate-400">
              <li>1. Open Calendar app</li>
              <li>2. Tap "Calendars" → "Add Calendar" → "Add Subscription Calendar"</li>
              <li>3. Paste the URL above</li>
              <li>4. Tap "Subscribe"</li>
            </ol>
          </div>

          {/* Google Calendar */}
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <p className="font-medium text-white">Google Calendar</p>
            </div>
            <ol className="mt-2 space-y-1 pl-6 text-sm text-slate-400">
              <li>1. Open Google Calendar on desktop</li>
              <li>2. Click "+" next to "Other calendars"</li>
              <li>3. Select "From URL"</li>
              <li>4. Paste the URL above</li>
              <li>5. Click "Add calendar"</li>
            </ol>
          </div>

          {/* Outlook */}
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              <p className="font-medium text-white">Outlook</p>
            </div>
            <ol className="mt-2 space-y-1 pl-6 text-sm text-slate-400">
              <li>1. Open Outlook Calendar</li>
              <li>2. Click "Add calendar" → "Subscribe from web"</li>
              <li>3. Paste the URL above</li>
              <li>4. Click "Import"</li>
            </ol>
          </div>
        </div>
      </div>

      {/* What's Included */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <h4 className="mb-3 font-semibold text-white">What's Included</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
            <span>All confirmed and pending bookings (next 6 months)</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
            <span>Guest details, vessel, meeting location</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
            <span>24-hour reminder notifications</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
            <span>Auto-updates when bookings change</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
            <span>Works on all devices (syncs via cloud)</span>
          </li>
        </ul>
      </div>

      {/* Regenerate Token */}
      <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <div>
          <p className="text-sm font-medium text-amber-300">Security Settings</p>
          <p className="mt-1 text-xs text-amber-200/70">
            Regenerate your calendar token if you suspect it's been compromised
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {/* Help Link */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
        <ExternalLink className="h-4 w-4" />
        <a
          href="https://docs.dockslot.app/calendar-sync"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-cyan-400"
        >
          Learn more about calendar sync
        </a>
      </div>
    </div>
  );
}
