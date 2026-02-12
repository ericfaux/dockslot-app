'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Code } from 'lucide-react';

interface EmbedCodeSnippetProps {
  captainId: string;
  bookingSlug?: string | null;
}

export function EmbedCodeSnippet({ captainId, bookingSlug }: EmbedCodeSnippetProps) {
  const [copied, setCopied] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');

  useEffect(() => {
    const bookPath = bookingSlug ? `/book/${bookingSlug}` : `/book/${captainId}`;
    setEmbedUrl(`${window.location.origin}${bookPath}/embed`);
  }, [captainId, bookingSlug]);

  const iframeCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="600"\n  style="border: none; border-radius: 12px; max-width: 800px;"\n  title="Book a Trip"\n></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  };

  if (!embedUrl) return null;

  return (
    <div>
      <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
        <pre className="overflow-x-auto text-xs font-mono text-slate-600 whitespace-pre-wrap pr-16">
          {iframeCode}
        </pre>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Adjust the height value to fit your page layout. Links will open in the parent window.
      </p>
    </div>
  );
}
