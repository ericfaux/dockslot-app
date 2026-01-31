'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export function ExportBookingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (preset?: string) => {
    setExporting(true);

    try {
      let url = '/api/bookings/export?format=csv';

      // Apply preset filters
      if (preset === 'this-month') {
        const now = new Date();
        const start = format(startOfMonth(now), 'yyyy-MM-dd');
        const end = format(endOfMonth(now), 'yyyy-MM-dd');
        url += `&startDate=${start}&endDate=${end}`;
      } else if (preset === 'last-month') {
        const lastMonth = subMonths(new Date(), 1);
        const start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        url += `&startDate=${start}&endDate=${end}`;
      } else if (preset === 'year') {
        const yearStart = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
        url += `&startDate=${yearStart}`;
      } else if (preset === 'confirmed') {
        url += `&status=confirmed,completed`;
      }

      // Trigger download
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'bookings.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export bookings. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-600"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-12 z-20 w-64 rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
            <div className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Export Bookings</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('this-month')}
                  disabled={exporting}
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-700 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4 text-cyan-400" />
                  <div>
                    <p className="font-medium">This Month</p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(), 'MMMM yyyy')}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('last-month')}
                  disabled={exporting}
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-700 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="font-medium">Last Month</p>
                    <p className="text-xs text-slate-400">
                      {format(subMonths(new Date(), 1), 'MMMM yyyy')}
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('year')}
                  disabled={exporting}
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-700 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="font-medium">This Year</p>
                    <p className="text-xs text-slate-400">
                      {new Date().getFullYear()} Year-to-Date
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('confirmed')}
                  disabled={exporting}
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-700 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-amber-400" />
                  <div>
                    <p className="font-medium">Confirmed Only</p>
                    <p className="text-xs text-slate-400">
                      All confirmed/completed trips
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => handleExport('all')}
                  disabled={exporting}
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-700 px-4 py-3 text-left text-sm text-white transition-colors hover:bg-slate-600 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="font-medium">All Bookings</p>
                    <p className="text-xs text-slate-400">
                      Complete booking history
                    </p>
                  </div>
                </button>
              </div>

              {exporting && (
                <div className="mt-3 text-center text-xs text-cyan-400">
                  Generating CSV...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
