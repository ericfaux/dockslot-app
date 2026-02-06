'use client'

import { Mail, Phone, Copy, MessageSquare, Check } from 'lucide-react'
import { useState } from 'react'

interface ContactQuickActionsProps {
  email: string
  phone?: string | null
  name: string
}

export default function ContactQuickActions({
  email,
  phone,
  name,
}: ContactQuickActionsProps) {
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null)

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatPhone = (phoneStr: string) => {
    // Remove all non-digits
    const digits = phoneStr.replace(/\D/g, '')
    
    // Format as (XXX) XXX-XXXX if 10 digits
    if (digits.length === 10) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
    }
    return phoneStr
  }

  return (
    <div className="space-y-3">
      <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500">
        Contact
      </h3>

      {/* Email */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <a
              href={`mailto:${email}`}
              className="flex-1 text-sm text-cyan-600 hover:underline truncate"
            >
              {email}
            </a>
          </div>
        </div>
        <button
          onClick={() => handleCopy(email, 'email')}
          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-cyan-600"
          title="Copy email"
        >
          {copied === 'email' ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <a
          href={`mailto:${email}?subject=Your DockSlot Booking - ${name}`}
          className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-cyan-600"
          title="Send email"
        >
          <Mail className="h-4 w-4" />
        </a>
      </div>

      {/* Phone */}
      {phone && (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded border border-slate-200 bg-slate-50 p-2.5">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-slate-500 flex-shrink-0" />
              <a
                href={`tel:${phone}`}
                className="flex-1 text-sm text-cyan-600 hover:underline"
              >
                {formatPhone(phone)}
              </a>
            </div>
          </div>
          <button
            onClick={() => handleCopy(phone, 'phone')}
            className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-cyan-600"
            title="Copy phone"
          >
            {copied === 'phone' ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
          <a
            href={`tel:${phone}`}
            className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-cyan-600"
            title="Call"
          >
            <Phone className="h-4 w-4" />
          </a>
          <a
            href={`sms:${phone}`}
            className="rounded p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-cyan-600"
            title="Text message"
          >
            <MessageSquare className="h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  )
}
