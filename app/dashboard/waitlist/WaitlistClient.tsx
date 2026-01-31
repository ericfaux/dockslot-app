'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Calendar,
  Mail,
  Phone,
  Trash2,
  Loader2,
} from 'lucide-react';
import { WaitlistEntry, WaitlistStats } from '@/lib/db/types';
import { format, parseISO } from 'date-fns';

export default function WaitlistClient() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('active');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  async function loadData() {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }

      const [entriesRes, statsRes] = await Promise.all([
        fetch(`/api/waitlist?${params}`),
        fetch('/api/waitlist/stats'),
      ]);

      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading waitlist:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this waitlist entry?')) {
      return;
    }

    try {
      const res = await fetch(`/api/waitlist/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }

  function formatDate(dateString: string) {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  }

  function formatTime(timeString: string | null) {
    if (!timeString) return 'Any time';
    try {
      const [hours, minutes] = timeString.split(':');
      const h = parseInt(hours, 10);
      const m = parseInt(minutes, 10);
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 || 12;
      return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
    } catch {
      return timeString;
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Waitlist</h1>
        <p className="text-slate-400 mt-1">
          Guests waiting for open slots on fully booked dates
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Waitlist */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Active Waitlist</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total_active}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                <Clock className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Notified */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Notified</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total_notified}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <Bell className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Converted */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Converted</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.total_converted}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.conversion_rate}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-700">
        {[
          { value: 'active', label: 'Active', count: stats?.total_active },
          { value: 'notified', label: 'Notified', count: stats?.total_notified },
          { value: 'converted', label: 'Converted', count: stats?.total_converted },
          { value: 'all', label: 'All', count: undefined },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              statusFilter === tab.value
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {/* Waitlist Entries */}
      {entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
              <Users className="h-8 w-8 text-slate-600" />
            </div>
          </div>
          <p className="text-slate-400">No waitlist entries found</p>
          <p className="text-sm text-slate-500 mt-1">
            Guests can join the waitlist when your slots are fully booked
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry: any) => (
            <div
              key={entry.id}
              className="rounded-lg border border-slate-700 bg-slate-900 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Guest Info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                      <Users className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{entry.guest_name}</p>
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="h-3.5 w-3.5" />
                        {entry.guest_email}
                        {entry.guest_phone && (
                          <>
                            <span>•</span>
                            <Phone className="h-3.5 w-3.5" />
                            {entry.guest_phone}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Trip Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Trip Type</p>
                      <p className="text-sm text-white mt-0.5">
                        {entry.trip_type?.title || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Preferred Date</p>
                      <p className="text-sm text-white mt-0.5 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(entry.preferred_date)}
                        {entry.flexible_dates && (
                          <span className="text-xs text-amber-400">(flexible)</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Time Window</p>
                      <p className="text-sm text-white mt-0.5">
                        {entry.preferred_time_start && entry.preferred_time_end
                          ? `${formatTime(entry.preferred_time_start)} - ${formatTime(entry.preferred_time_end)}`
                          : 'Any time'}
                      </p>
                    </div>
                  </div>

                  {/* Special Requests */}
                  {entry.special_requests && (
                    <div className="mt-3 p-3 rounded-md bg-slate-800/50">
                      <p className="text-xs text-slate-500 mb-1">Special Requests</p>
                      <p className="text-sm text-slate-300">{entry.special_requests}</p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    <span>Party size: {entry.party_size}</span>
                    <span>•</span>
                    <span>Added {formatDate(entry.created_at)}</span>
                    {entry.notified_at && (
                      <>
                        <span>•</span>
                        <span>Notified {formatDate(entry.notified_at)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {entry.status === 'active' && (
                    <button
                      onClick={() => updateStatus(entry.id, 'notified')}
                      className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                      title="Mark as notified"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                  )}
                  {(entry.status === 'active' || entry.status === 'notified') && (
                    <button
                      onClick={() => updateStatus(entry.id, 'converted')}
                      className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      title="Mark as converted"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
