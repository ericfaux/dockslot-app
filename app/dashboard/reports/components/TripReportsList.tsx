'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { FileText, Eye, Download, AlertTriangle, CheckCircle } from 'lucide-react';

interface TripReport {
  id: string;
  created_at: string;
  departure_time: string;
  arrival_time: string;
  actual_passengers: number;
  conditions_summary: string;
  incidents: string | null;
  notes: string | null;
  weather_conditions: any;
  booking: any;
}

interface Props {
  reports: TripReport[];
}

export function TripReportsList({ reports }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter((report) => {
    const booking = Array.isArray(report.booking) ? report.booking[0] : report.booking;
    const searchLower = searchQuery.toLowerCase();
    return (
      booking?.guest_name?.toLowerCase().includes(searchLower) ||
      report.conditions_summary?.toLowerCase().includes(searchLower) ||
      report.notes?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      {reports.length > 0 && (
        <div>
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid gap-4">
        {filteredReports.map((report) => {
          const booking = Array.isArray(report.booking) ? report.booking[0] : report.booking;
          const tripType = booking?.trip_type
            ? Array.isArray(booking.trip_type)
              ? booking.trip_type[0]
              : booking.trip_type
            : null;
          const vessel = booking?.vessel
            ? Array.isArray(booking.vessel)
              ? booking.vessel[0]
              : booking.vessel
            : null;

          const hasIncidents = report.incidents && report.incidents.trim().length > 0;
          const duration = calculateDuration(report.departure_time, report.arrival_time);

          return (
            <div
              key={report.id}
              className="rounded-lg border border-slate-700 bg-slate-800 p-6 transition-colors hover:border-slate-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        hasIncidents ? 'bg-amber-500/20' : 'bg-green-500/20'
                      }`}
                    >
                      {hasIncidents ? (
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        {tripType?.title} - {booking?.guest_name}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {format(parseISO(report.departure_time), 'MMM d, yyyy • h:mm a')} •{' '}
                        {vessel?.name}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="font-medium text-white">{duration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Passengers</p>
                      <p className="font-medium text-white">{report.actual_passengers}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Conditions</p>
                      <p className="font-medium text-white">{report.conditions_summary}</p>
                    </div>
                  </div>

                  {hasIncidents && (
                    <div className="mt-4 rounded-lg bg-amber-500/10 p-3">
                      <p className="text-xs font-medium text-amber-400">INCIDENT REPORTED</p>
                      <p className="mt-1 text-sm text-amber-200">{report.incidents}</p>
                    </div>
                  )}

                  {report.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-300 line-clamp-2">{report.notes}</p>
                    </div>
                  )}
                </div>

                <div className="ml-4 flex flex-col gap-2">
                  <Link
                    href={`/dashboard/reports/${report.id}`}
                    className="flex items-center gap-2 rounded-lg bg-slate-700 px-3 py-2 text-sm text-white transition-colors hover:bg-slate-600"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                  <button
                    onClick={() => downloadReport(report)}
                    className="flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredReports.length === 0 && searchQuery && (
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-600" />
          <p className="mt-2 text-slate-400">No reports match your search</p>
        </div>
      )}
    </div>
  );
}

function calculateDuration(departure: string, arrival: string): string {
  const start = new Date(departure);
  const end = new Date(arrival);
  const diffMs = end.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function downloadReport(report: TripReport) {
  const booking = Array.isArray(report.booking) ? report.booking[0] : report.booking;
  const tripType = booking?.trip_type
    ? Array.isArray(booking.trip_type)
      ? booking.trip_type[0]
      : booking.trip_type
    : null;

  const content = `
TRIP REPORT
===========

Date: ${format(parseISO(report.departure_time), 'MMMM d, yyyy')}
Trip Type: ${tripType?.title}
Guest: ${booking?.guest_name}

TIMELINE
--------
Departure: ${format(parseISO(report.departure_time), 'h:mm a')}
Arrival: ${format(parseISO(report.arrival_time), 'h:mm a')}
Duration: ${calculateDuration(report.departure_time, report.arrival_time)}

PASSENGERS
----------
Count: ${report.actual_passengers}

CONDITIONS
----------
Summary: ${report.conditions_summary}
${report.weather_conditions ? `Weather: ${JSON.stringify(report.weather_conditions, null, 2)}` : ''}

${
  report.incidents
    ? `
INCIDENTS
---------
${report.incidents}
`
    : ''
}

${
  report.notes
    ? `
NOTES
-----
${report.notes}
`
    : ''
}

Generated: ${new Date().toLocaleString()}
  `.trim();

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `trip-report-${format(parseISO(report.departure_time), 'yyyy-MM-dd')}-${booking?.guest_name?.replace(/\s+/g, '-') || 'guest'}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
