'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface ExportBookingsButtonProps {
  captainId: string
}

export function ExportBookingsButton({ captainId }: ExportBookingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const handleExport = async (preset?: string) => {
    setExporting(true);
    setExportStatus('Generating CSV...');

    try {
      const params = new URLSearchParams({ captainId })
      let url = '/api/bookings/export';

      // Apply preset filters
      if (preset === 'this-month') {
        const now = new Date();
        const start = format(startOfMonth(now), 'yyyy-MM-dd');
        const end = format(endOfMonth(now), 'yyyy-MM-dd');
        params.append('startDate', start)
        params.append('endDate', end)
      } else if (preset === 'last-month') {
        const lastMonth = subMonths(new Date(), 1);
        const start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
        params.append('startDate', start)
        params.append('endDate', end)
      } else if (preset === 'year') {
        const yearStart = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
        params.append('startDate', yearStart)
      } else if (preset === 'confirmed') {
        params.append('status', 'confirmed,completed')
      }

      setExportStatus('Downloading file...');
      
      // Trigger download
      const response = await fetch(`${url}?${params.toString()}`);

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

      setExportStatus('Export complete! ✓');
      setTimeout(() => {
        setIsOpen(false);
        setExportStatus(null);
      }, 1500);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('Export failed. Please try again.');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200"
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
          <div className="absolute right-0 top-12 z-20 w-64 rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Export Bookings</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('this-month')}
                  disabled={exporting}
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-100 px-4 py-3 text-left text-sm text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4 text-cyan-600" />
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
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-100 px-4 py-3 text-left text-sm text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50"
                >
                  <Calendar className="h-4 w-4 text-blue-600" />
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
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-100 px-4 py-3 text-left text-sm text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50"
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
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-100 px-4 py-3 text-left text-sm text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-amber-600" />
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
                  className="flex w-full items-center gap-3 rounded-lg bg-slate-100 px-4 py-3 text-left text-sm text-slate-900 transition-colors hover:bg-slate-200 disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="font-medium">All Bookings</p>
                    <p className="text-xs text-slate-400">
                      Complete booking history
                    </p>
                  </div>
                </button>
              </div>

              {exportStatus && (
                <div className={`mt-3 text-center text-xs font-medium ${
                  exportStatus.includes('failed') ? 'text-rose-600' :
                  exportStatus.includes('complete') ? 'text-green-400' :
                  'text-cyan-600'
                }`}>
                  {exportStatus}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
