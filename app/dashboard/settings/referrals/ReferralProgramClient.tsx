'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Gift,
  TrendingUp,
  DollarSign,
  Copy,
  Check,
  Power,
  Trash2,
  Loader2,
  Settings as SettingsIcon,
  UserPlus,
} from 'lucide-react';
import { ReferralSettings, ReferralCode, ReferralStats } from '@/lib/db/types';

export default function ReferralProgramClient() {
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [codes, setCodes] = useState<ReferralCode[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [settingsRes, codesRes, statsRes] = await Promise.all([
        fetch('/api/referral-settings'),
        fetch('/api/referral-codes'),
        fetch('/api/referral-stats'),
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }

      if (codesRes.ok) {
        const codesData = await codesRes.json();
        setCodes(codesData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function toggleCodeStatus(codeId: string) {
    try {
      const res = await fetch(`/api/referral-codes/${codeId}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error toggling code:', error);
    }
  }

  async function deleteCode(codeId: string) {
    if (!confirm('Delete this referral code? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/referral-codes/${codeId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete code');
      }
    } catch (error) {
      console.error('Error deleting code:', error);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function formatCurrency(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function formatReward(type: string, value: number) {
    if (type === 'percentage') return `${value}% off`;
    if (type === 'fixed') return formatCurrency(value);
    return 'Free Trip';
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
        <h1 className="text-2xl font-bold text-white">Referral Program</h1>
        <p className="text-slate-400 mt-1">
          Reward guests for bringing friends and grow your business organically
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Referrals */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Referrals</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.total_referrals}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </div>

          {/* Qualified Referrals */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Qualified</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.qualified_referrals}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Total Value */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Referral Revenue</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats.total_bookings_value_cents)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                <DollarSign className="h-6 w-6 text-amber-400" />
              </div>
            </div>
          </div>

          {/* Rewards Given */}
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Rewards Given</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {formatCurrency(stats.total_rewards_given_cents)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <Gift className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Program Settings */}
      {settings && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <SettingsIcon className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Program Settings</h2>
                <p className="text-sm text-slate-400">
                  {settings.is_enabled ? 'Program is active' : 'Program is disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSettingsEditor(!showSettingsEditor)}
              className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm font-medium"
            >
              {showSettingsEditor ? 'Cancel' : 'Edit Settings'}
            </button>
          </div>

          {!showSettingsEditor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400">Referrer Reward</p>
                <p className="text-white font-medium mt-1">
                  {formatReward(settings.referrer_reward_type, settings.referrer_reward_value)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Referee Reward</p>
                <p className="text-white font-medium mt-1">
                  {formatReward(settings.referee_reward_type, settings.referee_reward_value)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Minimum Booking Value</p>
                <p className="text-white font-medium mt-1">
                  {settings.min_booking_value_cents > 0
                    ? formatCurrency(settings.min_booking_value_cents)
                    : 'No minimum'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Reward Expiry</p>
                <p className="text-white font-medium mt-1">
                  {settings.reward_expiry_days} days
                </p>
              </div>
            </div>
          )}

          {showSettingsEditor && (
            <div className="space-y-4 border-t border-slate-700 pt-4 mt-4">
              <p className="text-sm text-amber-400">
                Settings editor coming soon! For now, use the database directly or contact support.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Referral Codes */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <UserPlus className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Referral Codes</h2>
              <p className="text-sm text-slate-400">{codes.length} codes created</p>
            </div>
          </div>
        </div>

        {codes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400">
              No referral codes yet. Codes are automatically generated when guests complete their first trip.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => (
              <div
                key={code.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-700 bg-slate-900/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => copyCode(code.code)}
                      className="font-mono text-lg font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-2"
                    >
                      {code.code}
                      {copiedCode === code.code ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    {!code.is_active && (
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white">{code.guest_name}</p>
                  <p className="text-xs text-slate-400">{code.guest_email}</p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs text-slate-400">
                      Used: <span className="text-white">{code.times_used}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Value: <span className="text-white">{formatCurrency(code.total_bookings_value_cents)}</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      Rewards: <span className="text-white">{formatCurrency(code.total_rewards_earned_cents)}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleCodeStatus(code.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      code.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                    title={code.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  {code.times_used === 0 && (
                    <button
                      onClick={() => deleteCode(code.id)}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Referrers */}
      {stats && stats.top_referrers && stats.top_referrers.length > 0 && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Top Referrers</h2>
              <p className="text-sm text-slate-400">Your best brand ambassadors</p>
            </div>
          </div>

          <div className="space-y-2">
            {stats.top_referrers.slice(0, 5).map((referrer, index) => (
              <div
                key={referrer.code}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{referrer.guest_name}</p>
                    <p className="text-xs text-slate-400">{referrer.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{referrer.times_used} referrals</p>
                  <p className="text-xs text-slate-400">
                    {formatCurrency(referrer.total_bookings_value_cents)} value
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
