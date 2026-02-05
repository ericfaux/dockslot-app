// components/booking/BookingSkeleton.tsx
// Skeleton loading components for booking pages (light theme)
// Provides visual feedback during data fetching

'use client';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 ${className}`}
    />
  );
}

// Calendar skeleton for DateSlotPicker
export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-10" />
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square" />
        ))}
      </div>
    </div>
  );
}

// Time slots skeleton
export function TimeSlotsSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
}

// Trip card skeleton
export function TripCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-slate-100 pb-4 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>

      {/* Description */}
      <Skeleton className="h-12 w-full mb-4" />

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Booking summary skeleton
export function BookingSummarySkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
      <Skeleton className="h-6 w-32 mb-4" />

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}

      <div className="border-t border-slate-200 pt-4">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
    </div>
  );
}

// Full booking page skeleton
export function BookingPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-1 w-12" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-1 w-12" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-1 w-12" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Main content card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <Skeleton className="h-6 w-40 mb-6" />
        <CalendarSkeleton />
      </div>

      {/* CTA button */}
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

// Form field skeleton
export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
