'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface ManagementLinkCardProps {
  token: string;
}

export function ManagementLinkCard({ token }: ManagementLinkCardProps) {
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
    <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-5">
      <h3 className="mb-2 text-sm font-semibold text-slate-900 flex items-center gap-2">
        <ExternalLink className="h-4 w-4 text-cyan-600" />
        Manage Your Booking
      </h3>
      <p className="mb-3 text-xs text-slate-500">
        Save this link to view details, check status, or modify your reservation.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={managementUrl}
          readOnly
          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
        />
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white hover:bg-cyan-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
    </div>
  );
}
