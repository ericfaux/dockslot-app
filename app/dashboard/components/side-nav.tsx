"use client";

// app/dashboard/components/side-nav.tsx
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, ChevronDown, HelpCircle } from "lucide-react";
import { primaryNavLinks, secondaryNavLinks } from "./nav-links";

interface SideNavProps {
  userEmail: string;
  signOutAction: () => Promise<void>;
}

export function SideNav({ userEmail, signOutAction }: SideNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Auto-expand "More" when a secondary link is active
  const isSecondaryActive = secondaryNavLinks.some((link) =>
    pathname.startsWith(link.href)
  );
  const showMore = moreOpen || isSecondaryActive;

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-16 lg:w-64 bg-slate-900 border-r border-slate-800 text-white transition-all duration-200 group/sidebar hover:md:w-64 z-30">
      <div className="flex flex-col h-full">
        {/* Logo / Brand */}
        <div className="flex items-center h-16 px-4 lg:px-6 border-b border-slate-800">
          <span className="text-lg font-semibold tracking-tight whitespace-nowrap overflow-hidden">
            <span className="hidden lg:inline group-hover/sidebar:inline">DockSlot</span>
            <span className="lg:hidden group-hover/sidebar:hidden">DS</span>
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          {/* Primary Links */}
          <ul className="space-y-1 px-2 lg:px-3">
            {primaryNavLinks.map((link) => {
              const isActive =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : link.href === "/dashboard/settings"
                    ? pathname.startsWith("/dashboard/settings")
                    : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    title={link.label}
                    className={`flex items-center gap-3 h-11 px-3 rounded-r-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                      isActive
                        ? "bg-slate-800 text-cyan-400 border-l-4 border-cyan-400 pl-2"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent pl-2"
                    }`}
                  >
                    <Icon size={18} aria-hidden="true" className="flex-shrink-0" />
                    <span className="hidden lg:inline group-hover/sidebar:inline whitespace-nowrap">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* More Section */}
          <div className="mt-4 px-2 lg:px-3 hidden lg:block group-hover/sidebar:block">
            <button
              type="button"
              onClick={() => setMoreOpen((prev) => !prev)}
              className="flex items-center justify-between w-full h-9 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-md"
              aria-expanded={showMore}
            >
              <span>More</span>
              <ChevronDown
                size={14}
                aria-hidden="true"
                className={`transition-transform duration-200 ${showMore ? "rotate-180" : ""}`}
              />
            </button>

            {showMore && (
              <ul className="space-y-1 mt-1">
                {secondaryNavLinks.map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  const Icon = link.icon;

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 h-10 px-3 rounded-r-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                          isActive
                            ? "bg-slate-800 text-cyan-400 border-l-4 border-cyan-400 pl-2"
                            : "text-slate-400 hover:bg-slate-800 hover:text-white border-l-4 border-transparent pl-2"
                        }`}
                      >
                        <Icon size={16} aria-hidden="true" className="flex-shrink-0" />
                        <span className="whitespace-nowrap">{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-slate-800 p-2 lg:p-4">
          <div className="mb-3 hidden lg:block group-hover/sidebar:block">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
              Signed in as
            </p>
            <p className="text-sm text-slate-300 truncate" title={userEmail}>
              {userEmail}
            </p>
          </div>
          <div className="space-y-2">
            <Link
              href="/docs"
              title="Help & Documentation"
              className="flex items-center justify-center gap-2 w-full h-11 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              <HelpCircle size={18} aria-hidden="true" className="flex-shrink-0" />
              <span className="hidden lg:inline group-hover/sidebar:inline whitespace-nowrap">Help</span>
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign Out"
                className="flex items-center justify-center gap-2 w-full h-11 px-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <LogOut size={18} aria-hidden="true" className="flex-shrink-0" />
                <span className="hidden lg:inline group-hover/sidebar:inline whitespace-nowrap">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  );
}
