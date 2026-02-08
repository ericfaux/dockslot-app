'use client';

import { useCallback, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        onPageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    },
    [currentPage, totalPages, onPageChange],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (totalPages <= 1) return null;

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {/* First & Prev — hidden on mobile, shown on sm+ */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        aria-label="First page"
        className="hidden rounded-lg border border-slate-300 p-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 sm:inline-flex"
      >
        <ChevronsLeft className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
        className="inline-flex rounded-lg border border-slate-300 p-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Page numbers — hidden on mobile, shown on sm+ */}
      {pages.map((page, idx) =>
        page === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className="hidden px-1 text-sm text-slate-400 sm:inline-flex"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`hidden h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors sm:inline-flex ${
              page === currentPage
                ? 'bg-cyan-600 text-white'
                : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {page}
          </button>
        ),
      )}

      {/* Mobile page indicator */}
      <span className="px-3 text-sm text-slate-600 sm:hidden">
        {currentPage} / {totalPages}
      </span>

      {/* Next & Last */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
        className="inline-flex rounded-lg border border-slate-300 p-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Last page"
        className="hidden rounded-lg border border-slate-300 p-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 sm:inline-flex"
      >
        <ChevronsRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
