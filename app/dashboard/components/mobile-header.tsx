"use client";

// app/dashboard/components/mobile-header.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { primaryNavLinks, secondaryNavLinks } from "./nav-links";

interface MobileHeaderProps {
  userEmail: string;
  signOutAction: () => Promise<void>;
}

export function MobileHeader({ userEmail, signOutAction }: MobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isSecondaryActive = secondaryNavLinks.some((link) =>
    pathname.startsWith(link.href)
  );
  const showMore = moreOpen || isSecondaryActive;

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
    menuButtonRef.current?.focus();
  }, []);

  const openDrawer = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDrawer();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDrawer]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Focus management: focus close button when drawer opens
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-slate-900 text-zinc-100 flex items-center justify-between px-4 border-b border-white/10">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={openDrawer}
          className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          aria-label="Open navigation menu"
          aria-expanded={isOpen}
          aria-controls="mobile-nav-drawer"
        >
          <Menu size={24} aria-hidden="true" />
        </button>
        <span className="text-lg font-semibold tracking-tight">DockSlot</span>
        {/* Spacer for centering */}
        <div className="w-11" />
      </header>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer (slides from left) */}
      <div
        id="mobile-nav-drawer"
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-slate-900 text-zinc-100 transform transition-transform duration-200 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="flex flex-col h-full">
          {/* Drawer Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
            <span className="text-lg font-semibold tracking-tight">
              DockSlot
            </span>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeDrawer}
              className="flex items-center justify-center w-11 h-11 rounded-md hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              aria-label="Close navigation menu"
            >
              <X size={24} aria-hidden="true" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 overflow-y-auto">
            {/* Primary Links */}
            <ul className="space-y-1 px-3">
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
                      onClick={closeDrawer}
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

            {/* More Section */}
            <div className="mt-4 px-3">
              <button
                type="button"
                onClick={() => setMoreOpen((prev) => !prev)}
                className="flex items-center justify-between w-full h-9 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-md"
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
                          onClick={closeDrawer}
                          className={`flex items-center gap-3 h-10 px-3 rounded-r-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                            isActive
                              ? "bg-white/10 text-white border-l-4 border-amber-500 pl-2"
                              : "text-zinc-400 hover:bg-white/5 hover:text-white border-l-4 border-transparent pl-2"
                          }`}
                        >
                          <Icon size={16} aria-hidden="true" />
                          <span>{link.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
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
      </div>
    </>
  );
}
