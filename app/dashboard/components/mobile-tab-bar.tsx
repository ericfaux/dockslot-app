"use client";

// app/dashboard/components/mobile-tab-bar.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNavLinks } from "./nav-links";

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-1 safe-bottom">
      {primaryNavLinks.map((link) => {
        const isActive =
          link.href === "/dashboard"
            ? pathname === "/dashboard"
            : link.href === "/dashboard/settings"
              ? pathname.startsWith("/dashboard/settings")
              : pathname.startsWith(link.href);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive
                ? "text-cyan-600"
                : "text-slate-400 active:text-slate-600"
            }`}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
