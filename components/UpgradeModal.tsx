'use client'

import { useState } from 'react'
import { X, Anchor, Sparkles } from 'lucide-react'
import { GatedFeature, getMinimumTier, getTierDisplayName } from '@/lib/subscription/gates'

interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature: GatedFeature
}

const FEATURE_DESCRIPTIONS: Partial<Record<GatedFeature, { title: string; description: string }>> = {
  helm_dashboard: {
    title: 'DockSlot Helm',
    description: 'Live tide, wind, and sunset data from NOAA for your meeting spot.',
  },
  weather_alerts: {
    title: 'Weather Alerts',
    description: 'NOAA weather alerts and monitoring for your area.',
  },
  float_plan: {
    title: 'Float Plan',
    description: 'Daily schedule overview with weather conditions for each trip.',
  },
  full_dashboard_stats: {
    title: 'Full Dashboard Stats',
    description: 'Revenue, deposit, and average booking analytics on your dashboard.',
  },
  full_email_suite: {
    title: 'Full Email Suite',
    description: 'Deposit reminders, trip reminders, weather alerts, and review request emails.',
  },
  sms_reminders: {
    title: 'SMS Notifications',
    description: 'Text message confirmations, day-of reminders, and weather hold alerts.',
  },
  custom_booking_branding: {
    title: 'Custom Booking Branding',
    description: 'Hero image, tagline, accent color, and custom URL slug for your booking page.',
  },
  website_embed: {
    title: 'Website Embed',
    description: 'Embed your booking widget directly on your own website.',
  },
  remove_dockslot_branding: {
    title: 'Remove DockSlot Branding',
    description: 'Remove the "Powered by DockSlot" badge from your public booking page.',
  },
  guest_crm: {
    title: 'Guest CRM',
    description: 'Track guest history, lifetime value, and trip statistics.',
  },
  reports: {
    title: 'Reports & Analytics',
    description: 'Revenue reports, booking analytics, and business insights.',
  },
  passenger_manifest: {
    title: 'Passenger Manifest',
    description: 'USCG-compliant passenger manifest for each trip.',
  },
  reviews_ratings: {
    title: 'Reviews & Ratings',
    description: 'Collect and display guest reviews and star ratings.',
  },
  waitlist: {
    title: 'Waitlist',
    description: 'Let guests join a waitlist when your trips are fully booked.',
  },
  booking_modifications: {
    title: 'Booking Modifications',
    description: 'Reschedule and modify existing bookings directly from the detail panel.',
  },
  captains_logbook: {
    title: "Captain's Logbook",
    description: 'Add notes, tags, and internal comments to bookings for your records.',
  },
  guest_portal: {
    title: 'Guest Portal',
    description: 'Give guests a self-service portal to view and manage their bookings.',
  },
  deposit_collection: {
    title: 'Stripe Deposits',
    description: 'Collect deposits and full payments online via Stripe.',
  },
  stripe_payments: {
    title: 'Stripe Payments',
    description: 'Accept credit card payments through Stripe Connect.',
  },
  promo_codes: {
    title: 'Promo Codes',
    description: 'Create discount codes for your booking page.',
  },
  csv_export: {
    title: 'CSV Export',
    description: 'Export your bookings to a CSV file for reporting and accounting.',
  },
  day_calendar_view: {
    title: 'Day Calendar View',
    description: 'See your schedule in a detailed day-by-day view with hourly slots.',
  },
  quick_block: {
    title: 'Quick Block',
    description: 'Quickly block off dates and time ranges to prevent bookings.',
  },
  print_booking: {
    title: 'Print Booking',
    description: 'Print booking confirmations and trip details.',
  },
  advanced_filters: {
    title: 'Advanced Filters',
    description: 'Filter bookings by status, payment, date range, and tags.',
  },
  bulk_actions: {
    title: 'Bulk Actions',
    description: 'Select multiple bookings and perform bulk operations.',
  },
  filter_presets: {
    title: 'Filter Presets',
    description: 'Save and quickly apply your most-used filter combinations.',
  },
  keyboard_shortcuts: {
    title: 'Keyboard Shortcuts',
    description: 'Quick keyboard shortcuts for common dashboard actions.',
  },
  quick_note: {
    title: 'Quick Note',
    description: 'Add quick notes from the dashboard floating action button.',
  },
  trip_reports: {
    title: 'Trip Reports',
    description: 'Post-trip reports with conditions and catch data.',
  },
  hibernation_mode: {
    title: 'Hibernation Mode',
    description: 'Pause bookings during off-season with a custom return message.',
  },
}

export function UpgradeModal({ isOpen, onClose, feature }: UpgradeModalProps) {
  if (!isOpen) return null

  const minTier = getMinimumTier(feature)
  const tierName = getTierDisplayName(minTier)
  const featureInfo = FEATURE_DESCRIPTIONS[feature]

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-md p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-50 to-blue-100">
            <Anchor className="h-7 w-7 text-cyan-600" />
          </div>

          {/* Title */}
          <h3 className="mt-4 text-center font-mono text-lg font-bold text-slate-800">
            Upgrade to {tierName}
          </h3>

          {/* Feature description */}
          {featureInfo && (
            <div className="mt-3 rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-500" />
                <span className="text-sm font-medium text-slate-700">{featureInfo.title}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">{featureInfo.description}</p>
            </div>
          )}

          {/* CTA */}
          <p className="mt-4 text-center text-sm text-slate-500">
            This feature is available on the <span className="font-semibold text-cyan-600">{tierName}</span> plan.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <a
              href="/dashboard/billing"
              className="flex items-center justify-center rounded-lg bg-cyan-600 px-6 py-3 font-mono text-sm font-bold text-white transition-colors hover:bg-cyan-700"
            >
              View Plans & Upgrade
            </a>
            <button
              onClick={onClose}
              className="rounded-lg px-6 py-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
