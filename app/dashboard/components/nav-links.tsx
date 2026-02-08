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
    href: "/dashboard/reports",
    label: "Reports",
    icon: BarChart3,
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
    href: "/dashboard/billing",
    label: "Billing",
    icon: CreditCard,
  },
];

/**
 * Full flat list for backward compatibility.
 * These items now live as tabs within Settings.
 */
export const navLinks: NavLink[] = [
  ...primaryNavLinks,
  ...secondaryNavLinks,
  // These now redirect to Settings tabs
  { href: "/dashboard/settings?tab=trip-types", label: "Trip Types", icon: Anchor },
  { href: "/dashboard/settings?tab=vessels", label: "Vessels", icon: Ship },
  { href: "/dashboard/settings?tab=waivers", label: "Waivers", icon: FileSignature },
  { href: "/dashboard/settings?tab=payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/settings?tab=booking-page", label: "Referrals", icon: Gift },
];
