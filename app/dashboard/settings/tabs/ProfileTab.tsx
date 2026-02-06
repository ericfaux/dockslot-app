'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  User,
  Building2,
  ChevronDown,
  AlertCircle,
} from 'lucide-react';
import { Profile } from '@/lib/db/types';
import { updateProfile } from '@/app/actions/profile';

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (AZ)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time (AST)' },
];

interface ProfileTabProps {
  initialProfile: Profile | null;
  userEmail: string;
}

export function ProfileTab({ initialProfile, userEmail }: ProfileTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState(initialProfile?.full_name || '');
  const [email, setEmail] = useState(initialProfile?.email || userEmail);
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [businessName, setBusinessName] = useState(initialProfile?.business_name || '');
  const [timezone, setTimezone] = useState(initialProfile?.timezone || 'America/New_York');

  const hasChanges = useMemo(() => {
    return (
      fullName !== (initialProfile?.full_name || '') ||
      email !== (initialProfile?.email || userEmail) ||
      phone !== (initialProfile?.phone || '') ||
      businessName !== (initialProfile?.business_name || '') ||
      timezone !== (initialProfile?.timezone || 'America/New_York')
    );
  }, [fullName, email, phone, businessName, timezone, initialProfile, userEmail]);

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      const result = await updateProfile({
        full_name: fullName || null,
        email: email || null,
        phone: phone || null,
        business_name: businessName || null,
        timezone,
      });

      if (result.success) {
        setSuccess('Profile saved successfully');
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save profile');
      }
    });
  };

  const inputClassName = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500";
  const labelClassName = "block text-sm font-medium text-slate-600 mb-1.5";
  const sectionClassName = "rounded-xl border border-slate-200 bg-white p-6";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}

      {/* Profile Information */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="fullName" className={labelClassName}>
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Captain John Smith"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClassName}>
              Contact Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="captain@example.com"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClassName}>
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="timezone" className={labelClassName}>
              Timezone
            </label>
            <div className="relative">
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`${inputClassName} appearance-none pr-10`}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </section>

      {/* Business Information */}
      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Business Information</h2>
        </div>
        <div>
          <label htmlFor="businessName" className={labelClassName}>
            Business Name
          </label>
          <input
            id="businessName"
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Captain John's Charter Fishing"
            className={inputClassName}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            This name will appear on booking confirmations and guest communications.
          </p>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {hasChanges && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            Unsaved changes
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="group flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-75 hover:bg-cyan-500 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            boxShadow: hasChanges ? '0 4px 14px rgba(34, 211, 238, 0.25)' : undefined,
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
