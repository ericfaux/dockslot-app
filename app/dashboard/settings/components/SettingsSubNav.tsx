"use client";

// app/dashboard/settings/components/SettingsSubNav.tsx
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
    href: "/dashboard/vessels",
    label: "Vessels",
    description: "Manage your boats",
    icon: Ship,
  },
  {
    href: "/dashboard/trips",
    label: "Trip Types",
    description: "Configure trip offerings",
    icon: Anchor,
  },
  {
    href: "/dashboard/waivers",
    label: "Waivers",
    description: "Liability waivers",
    icon: FileSignature,
  },
  {
    href: "/dashboard/payments",
    label: "Payments",
    description: "Payment configuration",
    icon: CreditCard,
  },
  {
    href: "/dashboard/settings/referrals",
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
    href: "/dashboard/settings/availability-templates",
    label: "Availability",
    description: "Availability templates",
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
        <div className="h-px flex-1 bg-slate-800" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-colors group"
            >
              <Icon
                size={18}
                className="text-zinc-500 group-hover:text-cyan-400 transition-colors shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {link.label}
                </p>
                <p className="text-[11px] text-zinc-500 truncate hidden sm:block">
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
