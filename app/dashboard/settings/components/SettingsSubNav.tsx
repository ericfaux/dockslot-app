"use client";

// app/dashboard/settings/components/SettingsSubNav.tsx
// This component is kept for backward compatibility but is no longer used
// in the main settings page (replaced by SettingsTabs).
// It may still be referenced by other pages.

import Link from "next/link";
import {
  Ship,
  Anchor,
  FileSignature,
  CreditCard,
  Gift,
  FileText,
  Calendar,
  MessageSquare,
} from "lucide-react";

const settingsLinks = [
  {
    href: "/dashboard/settings?tab=vessels",
    label: "Vessels",
    description: "Manage your boats",
    icon: Ship,
  },
  {
    href: "/dashboard/settings?tab=trip-types",
    label: "Trip Types",
    description: "Configure trip offerings",
    icon: Anchor,
  },
  {
    href: "/dashboard/settings?tab=waivers",
    label: "Waivers",
    description: "Liability waivers",
    icon: FileSignature,
  },
  {
    href: "/dashboard/settings?tab=payments",
    label: "Payments",
    description: "Payment configuration",
    icon: CreditCard,
  },
  {
    href: "/dashboard/settings?tab=booking-page",
    label: "Referrals",
    description: "Referral program",
    icon: Gift,
  },
  {
    href: "/dashboard/settings/cancellation",
    label: "Cancellation Policy",
    description: "Refund terms per trip",
    icon: FileText,
  },
  {
    href: "/dashboard/settings/templates",
    label: "Templates",
    description: "Message templates",
    icon: MessageSquare,
  },
  {
    href: "/dashboard/settings?tab=availability",
    label: "Availability",
    description: "Weekly schedule & booking settings",
    icon: Calendar,
  },
];

export function SettingsSubNav() {
  return (
    <section aria-label="Settings Navigation">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
          Configuration
        </span>
        <div className="h-px flex-1 bg-white" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-3 rounded-lg bg-white border border-white/5 hover:bg-white/5 hover:border-slate-200 transition-colors group"
            >
              <Icon
                size={18}
                className="text-slate-500 group-hover:text-cyan-600 transition-colors shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {link.label}
                </p>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                  {link.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
