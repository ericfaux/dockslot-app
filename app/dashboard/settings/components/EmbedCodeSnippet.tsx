'use client';

import { useState, useEffect } from 'react';
import { Check, Copy, Search } from 'lucide-react';

interface EmbedCodeSnippetProps {
  captainId: string;
  bookingSlug?: string | null;
}

type EmbedTab = 'widget' | 'iframe';

export function EmbedCodeSnippet({ captainId, bookingSlug }: EmbedCodeSnippetProps) {
  const [activeTab, setActiveTab] = useState<EmbedTab>('widget');
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const identifier = bookingSlug || captainId;
  const embedUrl = origin ? `${origin}/book/${identifier}/embed` : '';

  const iframeCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="600"\n  style="border: none; border-radius: 12px; max-width: 800px;"\n  title="Book a Trip"\n></iframe>`;

  const widgetCode = `<div data-dockslot-widget="${identifier}"></div>\n<script src="${origin}/widget.js" defer></script>`;

  const activeCode = activeTab === 'widget' ? widgetCode : iframeCode;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  };

  if (!origin) return null;

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-4">
        <button
          type="button"
          onClick={() => { setActiveTab('widget'); setCopied(false); }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'widget'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          JavaScript Widget (SEO)
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('iframe'); setCopied(false); }}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'iframe'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Iframe
        </button>
      </div>

      {/* Code snippet */}
      <div className="relative rounded-lg border border-slate-200 bg-slate-50 p-4">
        <pre className="overflow-x-auto text-xs font-mono text-slate-600 whitespace-pre-wrap pr-16">
          {activeCode}
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

      {/* Help text */}
      {activeTab === 'widget' ? (
        <p className="mt-2 text-xs text-slate-400">
          Renders trip cards directly on your page with structured data that search engines can index, improving your site&apos;s SEO.
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Adjust the height value to fit your page layout. Links will open in the parent window. Iframe content is not indexed by search engines.
        </p>
      )}
    </div>
  );
}
