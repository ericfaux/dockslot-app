// app/dashboard/components/nav-links.tsx
import {
  Anchor,
  CalendarDays,
  LayoutDashboard,
  Users,
  Ship,
  Settings,
  FileSignature,
  BarChart3,
  FileText,
  CreditCard,
  List,
  Star,
  RefreshCw,
  Gift,
  Clock,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Primary nav — always visible (5 items) */
export const primaryNavLinks: NavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/schedule",
    label: "Schedule",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/bookings",
    label: "Bookings",
    icon: List,
  },
  {
    href: "/dashboard/guests",
    label: "Guests",
    icon: Users,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];

/** Secondary nav — shown in collapsible "More" section */
export const secondaryNavLinks: NavLink[] = [
  {
    href: "/dashboard/reports",
    label: "Reports",
    icon: FileText,
  },
  {
    href: "/dashboard/modifications",
    label: "Modifications",
    icon: RefreshCw,
  },
  {
    href: "/dashboard/waitlist",
    label: "Waitlist",
    icon: Clock,
  },
  {
    href: "/dashboard/manifest",
    label: "Manifest",
    icon: Users,
  },
  {
    href: "/dashboard/reviews",
    label: "Reviews",
    icon: Star,
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    href: "/dashboard/reports-advanced",
    label: "Advanced Reports",
    icon: BarChart3,
  },
];

/**
 * Full flat list for backward compatibility.
 * Includes all primary + secondary links plus items that moved into Settings.
 */
export const navLinks: NavLink[] = [
  ...primaryNavLinks,
  ...secondaryNavLinks,
  // These still exist as pages but are now accessed via Settings sub-nav
  { href: "/dashboard/trips", label: "Trip Types", icon: Anchor },
  { href: "/dashboard/vessels", label: "Vessels", icon: Ship },
  { href: "/dashboard/waivers", label: "Waivers", icon: FileSignature },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/settings/referrals", label: "Referrals", icon: Gift },
];
