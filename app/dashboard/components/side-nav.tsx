"use client";

// app/dashboard/components/side-nav.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { navLinks } from "./nav-links";

interface SideNavProps {
  userEmail: string;
  signOutAction: () => Promise<void>;
}

export function SideNav({ userEmail, signOutAction }: SideNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-slate-900 text-zinc-100">
      <div className="flex flex-col h-full">
        {/* Logo / Brand */}
        <div className="flex items-center h-16 px-6 border-b border-white/10">
          <span className="text-lg font-semibold tracking-tight">DockSlot</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`flex items-center gap-3 h-11 px-3 rounded-r-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      isActive
                        ? "bg-white/10 text-white border-l-4 border-amber-500 pl-2"
                        : "text-zinc-300 hover:bg-white/5 hover:text-white border-l-4 border-transparent pl-2"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-white/10 p-4">
          <div className="mb-3">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
              Signed in as
            </p>
            <p className="text-sm text-zinc-100 truncate" title={userEmail}>
              {userEmail}
            </p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full h-11 px-3 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <LogOut size={18} aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
