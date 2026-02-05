// components/booking/ShareBookingButton.tsx
// Share booking details via native share API or clipboard (light theme)

'use client';

import { Share2, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareBookingButtonProps {
  title: string;
  text: string;
  url?: string;
  className?: string;
}

export function ShareBookingButton({
  title,
  text,
  url,
  className = '',
}: ShareBookingButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareContent = {
    title,
    text,
    url: url || (typeof window !== 'undefined' ? window.location.href : ''),
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareContent);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
      }
    }

    try {
      const shareText = `${title}\n\n${text}${url ? `\n\n${url}` : ''}`;
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`
        flex items-center justify-center gap-2 w-full
        rounded-xl border border-slate-200 bg-white
        px-4 py-3 text-sm font-medium text-slate-700
        transition-colors hover:bg-slate-50 shadow-sm
        min-h-[48px]
        ${className}
      `}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 text-emerald-500" />
          <span>Copied to clipboard!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4 text-cyan-600" />
          <span>Share Trip Details</span>
        </>
      )}
    </button>
  );
}
