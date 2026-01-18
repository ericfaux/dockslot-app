// app/dashboard/components/nav-links.tsx
import {
  Anchor,
  CalendarDays,
  LayoutDashboard,
  Users,
  Ship,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navLinks: NavLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/trips",
    label: "Trips",
    icon: Anchor,
  },
  {
    href: "/dashboard/schedule",
    label: "Schedule",
    icon: CalendarDays,
  },
  {
    href: "/dashboard/manifest",
    label: "Manifest",
    icon: Users,
  },
  {
    href: "/dashboard/vessels",
    label: "Vessels",
    icon: Ship,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
];
