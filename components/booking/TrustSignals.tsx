// components/booking/TrustSignals.tsx
// Trust signals for the booking flow
// Includes secure payment badge, cancellation policy, captain info

'use client';

import { Shield, Lock, Clock, User, AlertCircle, MapPin, Star } from 'lucide-react';
import Image from 'next/image';

// Secure payment badge
interface SecurePaymentBadgeProps {
  className?: string;
}

export function SecurePaymentBadge({ className = '' }: SecurePaymentBadgeProps) {
  return (
    <div
      className={`
        flex items-center gap-2 text-sm text-slate-400
        ${className}
      `}
    >
      <Lock className="h-4 w-4 text-green-400" />
      <span>Secure payment via Stripe</span>
      <Shield className="h-4 w-4 text-slate-500" />
    </div>
  );
}

// Cancellation policy preview
interface CancellationPolicyProps {
  policy?: string;
  hoursNotice?: number;
  className?: string;
}

export function CancellationPolicy({
  policy,
  hoursNotice = 24,
  className = '',
}: CancellationPolicyProps) {
  return (
    <div
      className={`
        rounded-lg border border-slate-700 bg-slate-800/50 p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <Clock className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-slate-100 mb-1">
            Cancellation Policy
          </h4>
          {policy ? (
            <p className="text-sm text-slate-400">{policy}</p>
          ) : (
            <p className="text-sm text-slate-400">
              Free cancellation up to {hoursNotice} hours before your trip.
              Deposit refunded minus processing fees.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Captain info card
interface CaptainInfoCardProps {
  name: string;
  businessName?: string | null;
  avatarUrl?: string | null;
  meetingSpotName?: string | null;
  meetingSpotAddress?: string | null;
  timezone?: string | null;
  className?: string;
  compact?: boolean;
}

export function CaptainInfoCard({
  name,
  businessName,
  avatarUrl,
  meetingSpotName,
  meetingSpotAddress,
  timezone,
  className = '',
  compact = false,
}: CaptainInfoCardProps) {
  // Generate initials for avatar fallback
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {/* Avatar */}
        <div className="relative h-10 w-10 flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-sm font-semibold">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-100 truncate">
            {businessName || name}
          </p>
          {meetingSpotName && (
            <p className="text-xs text-slate-400 truncate">
              <MapPin className="inline h-3 w-3 mr-1" />
              {meetingSpotName}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-lg border border-slate-700 bg-slate-800/50 p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative h-14 w-14 flex-shrink-0">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              fill
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 text-lg font-semibold">
              {initials}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-slate-100">
            {businessName || name}
          </h4>
          {businessName && name && (
            <p className="text-sm text-slate-400 flex items-center gap-1">
              <User className="h-3 w-3" />
              Captain {name.split(' ')[0]}
            </p>
          )}

          {/* Meeting location */}
          {meetingSpotName && (
            <div className="mt-2 flex items-start gap-2 text-sm text-slate-400">
              <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300">{meetingSpotName}</p>
                {meetingSpotAddress && (
                  <p className="text-slate-500 text-xs mt-0.5">{meetingSpotAddress}</p>
                )}
              </div>
            </div>
          )}

          {/* Timezone */}
          {timezone && (
            <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              All times in {timezone.replace(/_/g, ' ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Combined trust signals section
interface TrustSignalsSectionProps {
  captain?: {
    name: string;
    businessName?: string | null;
    avatarUrl?: string | null;
    meetingSpotName?: string | null;
    meetingSpotAddress?: string | null;
    timezone?: string | null;
  };
  showCancellationPolicy?: boolean;
  cancellationPolicy?: string;
  showSecureBadge?: boolean;
  className?: string;
}

export function TrustSignalsSection({
  captain,
  showCancellationPolicy = true,
  cancellationPolicy,
  showSecureBadge = true,
  className = '',
}: TrustSignalsSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {captain && (
        <CaptainInfoCard
          name={captain.name}
          businessName={captain.businessName}
          avatarUrl={captain.avatarUrl}
          meetingSpotName={captain.meetingSpotName}
          meetingSpotAddress={captain.meetingSpotAddress}
          timezone={captain.timezone}
        />
      )}

      {showCancellationPolicy && (
        <CancellationPolicy policy={cancellationPolicy} />
      )}

      {showSecureBadge && (
        <div className="flex justify-center">
          <SecurePaymentBadge />
        </div>
      )}
    </div>
  );
}
