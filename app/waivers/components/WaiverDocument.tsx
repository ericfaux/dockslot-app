'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface WaiverDocumentProps {
  title: string;
  content: string;
  version?: number;
  onScrollToEnd?: () => void;
}

export function WaiverDocument({
  title,
  content,
  version,
  onScrollToEnd,
}: WaiverDocumentProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = element;
      const isAtEnd = scrollTop + clientHeight >= scrollHeight - 20;

      if (isAtEnd && !hasScrolledToEnd) {
        setHasScrolledToEnd(true);
        onScrollToEnd?.();
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [hasScrolledToEnd, onScrollToEnd]);

  // Format content - handle newlines and basic markdown
  const formatContent = (text: string) => {
    // Split into paragraphs and process
    return text.split('\n\n').map((paragraph, i) => {
      // Check for headers (lines starting with #)
      if (paragraph.startsWith('# ')) {
        return (
          <h2 key={i} className="text-lg font-bold text-slate-800 mt-4 mb-2">
            {paragraph.slice(2)}
          </h2>
        );
      }
      if (paragraph.startsWith('## ')) {
        return (
          <h3 key={i} className="text-base font-semibold text-slate-800 mt-3 mb-2">
            {paragraph.slice(3)}
          </h3>
        );
      }
      if (paragraph.startsWith('### ')) {
        return (
          <h4 key={i} className="text-sm font-semibold text-slate-800 mt-2 mb-1">
            {paragraph.slice(4)}
          </h4>
        );
      }

      // Check for bullet lists
      if (paragraph.includes('\n- ') || paragraph.startsWith('- ')) {
        const items = paragraph.split('\n').filter((line) => line.startsWith('- '));
        return (
          <ul key={i} className="list-disc list-inside space-y-1 my-2 text-slate-700">
            {items.map((item, j) => (
              <li key={j}>{item.slice(2)}</li>
            ))}
          </ul>
        );
      }

      // Check for numbered lists
      if (/^\d+\.\s/.test(paragraph)) {
        const items = paragraph.split('\n').filter((line) => /^\d+\.\s/.test(line));
        return (
          <ol key={i} className="list-decimal list-inside space-y-1 my-2 text-slate-700">
            {items.map((item, j) => (
              <li key={j}>{item.replace(/^\d+\.\s/, '')}</li>
            ))}
          </ol>
        );
      }

      // Regular paragraph - handle inline formatting
      const processedText = paragraph
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br />');

      return (
        <p
          key={i}
          className="text-slate-700 leading-relaxed my-2"
          dangerouslySetInnerHTML={{ __html: processedText }}
        />
      );
    });
  };

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
            <FileText className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            {version && (
              <p className="text-xs text-slate-400">Version {version}</p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div
          ref={contentRef}
          className="p-4 bg-slate-50 max-h-[400px] overflow-y-auto scroll-smooth"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#475569 #f1f5f9',
          }}
        >
          <div className="prose prose-sm max-w-none">
            {formatContent(content)}
          </div>

          {/* Scroll indicator */}
          {!hasScrolledToEnd && onScrollToEnd && (
            <div className="sticky bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
              <div className="text-center">
                <span className="inline-flex items-center gap-1 text-xs text-slate-500 animate-pulse">
                  <ChevronDown className="h-3 w-3" />
                  Scroll to read entire document
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
