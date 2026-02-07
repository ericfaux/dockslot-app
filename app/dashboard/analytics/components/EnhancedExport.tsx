'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Calendar, ChevronDown, X, Loader2 } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear } from 'date-fns';

interface Props {
  captainId: string;
}

type ExportPreset = 'this-month' | 'last-month' | 'this-quarter' | 'year' | 'all' | 'custom';

export function EnhancedExport({ captainId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingPreset, setExportingPreset] = useState<ExportPreset | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handleExport = async (preset: ExportPreset) => {
    if (preset === 'custom') {
      setShowCustomRange(true);
      return;
    }

    setExporting(true);
    setExportingPreset(preset);
    setExportStatus('Generating CSV...');

    try {
      const params = new URLSearchParams({ captainId });
      const now = new Date();

      // Apply preset filters
      if (preset === 'this-month') {
        params.append('startDate', format(startOfMonth(now), 'yyyy-MM-dd'));
        params.append('endDate', format(endOfMonth(now), 'yyyy-MM-dd'));
      } else if (preset === 'last-month') {
        const lastMonth = subMonths(now, 1);
        params.append('startDate', format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        params.append('endDate', format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
      } else if (preset === 'this-quarter') {
        const quarterStart = subMonths(now, 2);
        params.append('startDate', format(startOfMonth(quarterStart), 'yyyy-MM-dd'));
        params.append('endDate', format(endOfMonth(now), 'yyyy-MM-dd'));
      } else if (preset === 'year') {
        params.append('startDate', format(startOfYear(now), 'yyyy-MM-dd'));
      }

      await downloadExport(params);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('Export failed. Please try again.');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setExporting(false);
      setExportingPreset(null);
    }
  };

  const handleCustomExport = async () => {
    if (!customStart || !customEnd) {
      setExportStatus('Please select both dates');
      setTimeout(() => setExportStatus(null), 2000);
      return;
    }

    setExporting(true);
    setExportingPreset('custom');
    setExportStatus('Generating CSV...');

    try {
      const params = new URLSearchParams({ captainId });
      params.append('startDate', customStart);
      params.append('endDate', customEnd);
      await downloadExport(params);
      setShowCustomRange(false);
      setCustomStart('');
      setCustomEnd('');
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('Export failed. Please try again.');
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setExporting(false);
      setExportingPreset(null);
    }
  };

  const downloadExport = async (params: URLSearchParams) => {
    setExportStatus('Downloading file...');

    const response = await fetch(`/api/bookings/export?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download =
      response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
      'bookings.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(downloadUrl);

    setExportStatus('Export complete!');
    setTimeout(() => {
      setIsOpen(false);
      setExportStatus(null);
    }, 1500);
  };

  const presets = [
    {
      id: 'this-month' as const,
      label: 'This Month',
      sublabel: format(new Date(), 'MMMM yyyy'),
      icon: Calendar,
      color: 'text-cyan-600',
    },
    {
      id: 'last-month' as const,
      label: 'Last Month',
      sublabel: format(subMonths(new Date(), 1), 'MMMM yyyy'),
      icon: Calendar,
      color: 'text-blue-600',
    },
    {
      id: 'this-quarter' as const,
      label: 'Last 3 Months',
      sublabel: 'Quarterly report',
      icon: FileSpreadsheet,
      color: 'text-purple-600',
    },
    {
      id: 'year' as const,
      label: 'Year to Date',
      sublabel: `${new Date().getFullYear()} YTD`,
      icon: FileSpreadsheet,
      color: 'text-green-400',
    },
    {
      id: 'all' as const,
      label: 'All Time',
      sublabel: 'Complete history',
      icon: FileSpreadsheet,
      color: 'text-amber-600',
    },
    {
      id: 'custom' as const,
      label: 'Custom Range',
      sublabel: 'Select dates',
      icon: Calendar,
      color: 'text-slate-400',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200"
      >
        {exporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => {
              setIsOpen(false);
              setShowCustomRange(false);
            }}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 top-12 z-20 w-72 rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Export Bookings</h3>
                {showCustomRange && (
                  <button
                    onClick={() => setShowCustomRange(false)}
                    className="text-slate-400 hover:text-slate-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {showCustomRange ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCustomExport}
                    disabled={exporting || !customStart || !customEnd}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exportingPreset === 'custom' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {exportingPreset === 'custom' ? 'Exporting...' : 'Export Range'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleExport(preset.id)}
                      disabled={exporting}
                      className="flex w-full items-center gap-3 rounded-lg bg-slate-100 px-3 py-2.5 text-left text-sm text-slate-900 transition-colors hover:bg-slate-100 disabled:opacity-50"
                    >
                      {exportingPreset === preset.id ? (
                        <Loader2 className={`h-4 w-4 animate-spin ${preset.color}`} />
                      ) : (
                        <preset.icon className={`h-4 w-4 ${preset.color}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{preset.label}</p>
                        <p className="text-xs text-slate-400">{preset.sublabel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {exportStatus && (
                <div
                  className={`mt-3 text-center text-xs font-medium ${
                    exportStatus.includes('failed')
                      ? 'text-rose-600'
                      : exportStatus.includes('complete')
                        ? 'text-green-400'
                        : 'text-cyan-600'
                  }`}
                >
                  {exportStatus}
                </div>
              )}

              <p className="mt-3 text-xs text-slate-500 text-center">
                CSV includes all booking details for tax records
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
