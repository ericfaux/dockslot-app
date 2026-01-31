'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface ManagementLinkCardProps {
  token: string;
  guestEmail: string;
}

export function ManagementLinkCard({ token, guestEmail }: ManagementLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const managementUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/manage/${token}` 
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(managementUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mb-6 rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-6">
      <h2 className="mb-3 text-lg font-semibold text-slate-100">
        Manage Your Booking
      </h2>
      <p className="mb-4 text-sm text-slate-300">
        Save this link to view your booking details, check status, and manage your reservation:
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={managementUrl}
          readOnly
          className="flex-1 rounded-lg border border-slate-600 bg-slate-900 px-4 py-2 text-sm text-slate-100"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400"
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
      <p className="mt-3 text-xs text-slate-500">
        We'll also email this link to {guestEmail}
      </p>
    </div>
  );
}
