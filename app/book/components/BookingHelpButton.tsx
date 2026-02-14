'use client';

import { useState, useRef, useEffect } from 'react';
import { LifeBuoy, Mail, Phone, X } from 'lucide-react';

interface BookingHelpButtonProps {
  email: string | null;
  phone: string | null;
  captainName: string | null;
}

export function BookingHelpButton({ email, phone, captainName }: BookingHelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Click-outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Don't render if nothing to show
  if (!email && !phone) {
    return null;
  }

  const displayName = captainName || 'the Captain';

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute bottom-14 left-0 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">
              Need Help?
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Contact {displayName} directly:
          </p>
          <div className="space-y-2">
            {email && (
              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 hover:border-slate-200 transition-colors"
              >
                <Mail className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-100 hover:border-slate-200 transition-colors"
              >
                <Phone className="h-4 w-4 text-cyan-600 flex-shrink-0" />
                <span>{phone}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg hover:shadow-xl hover:border-slate-300 transition-all duration-200 active:scale-95"
        aria-label="Get help"
        title="Need help? Contact the captain"
      >
        <LifeBuoy className="h-5 w-5 text-slate-600" />
      </button>
    </div>
  );
}
