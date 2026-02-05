'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, ExternalLink, Link2, Share2 } from 'lucide-react';

interface BookingLinkCardProps {
  captainId: string;
  compact?: boolean; // For dashboard vs settings view
}

export function BookingLinkCard({ captainId, compact = false }: BookingLinkCardProps) {
  const [copied, setCopied] = useState(false);
  const [bookingUrl, setBookingUrl] = useState(`/book/${captainId}`);
  const [isDismissed, setIsDismissed] = useState(false);

  // Build the full URL on the client side
  useEffect(() => {
    setBookingUrl(`${window.location.origin}/book/${captainId}`);
  }, [captainId]);

  // Check localStorage for dismissed state (only in compact/dashboard mode)
  useEffect(() => {
    if (compact) {
      const dismissed = localStorage.getItem('bookingLinkDismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [compact]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = bookingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('bookingLinkDismissed', 'true');
  };

  const handleExpand = () => {
    setIsDismissed(false);
    localStorage.removeItem('bookingLinkDismissed');
  };

  if (compact) {
    // Collapsed state: just a small "Share Link" button
    if (isDismissed) {
      return (
        <button
          onClick={handleExpand}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <Share2 className="h-4 w-4 text-cyan-400" />
          Share Booking Link
        </button>
      );
    }

    // Expanded compact version for dashboard
    return (
      <div
        className="rounded-lg bg-slate-800 p-4"
        style={{
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Your Booking Link
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-xs text-slate-500 transition-colors hover:text-slate-300"
          >
            Minimize
          </button>
        </div>

        <div className="flex items-center gap-2 rounded bg-slate-900 px-3 py-2">
          <code className="flex-1 truncate font-mono text-sm text-slate-300">
            {bookingUrl}
          </code>

          <button
            onClick={copyToClipboard}
            className="rounded p-1.5 transition-colors hover:bg-slate-700"
            title="Copy link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4 text-slate-400" />
            )}
          </button>

          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded p-1.5 transition-colors hover:bg-slate-700"
            title="Preview booking page"
          >
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </a>
        </div>

        {copied && (
          <p className="mt-2 text-xs text-emerald-400">
            Copied to clipboard!
          </p>
        )}
      </div>
    );
  }

  // Full version for settings page
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="h-5 w-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Your Booking Page</h2>
      </div>

      <p className="mb-4 text-sm text-slate-400">
        Share this link with guests so they can book trips directly with you.
        Post it on social media, add it to your website, or send it via email.
      </p>

      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3">
        <code className="flex-1 truncate font-mono text-sm text-slate-300">
          {bookingUrl}
        </code>

        <button
          onClick={copyToClipboard}
          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
            copied
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
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

        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-cyan-500"
        >
          <ExternalLink className="h-4 w-4" />
          Preview
        </a>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Guests can view your available trip types and request a booking at this link.
      </p>
    </div>
  );
}
