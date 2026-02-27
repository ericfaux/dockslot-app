'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

export function PrintActions() {
  return (
    <div className="print:hidden flex items-center justify-between mb-8">
      <Link
        href="/dashboard/settings?tab=waivers"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Waivers
      </Link>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-400"
      >
        <Printer className="h-4 w-4" />
        Print Waiver
      </button>
    </div>
  );
}
