'use client'

import { useState, useEffect } from 'react'
import { X, Send, Mail, FileText, Loader2, MessageSquare } from 'lucide-react'
import type { CalendarBooking } from '@/components/calendar/types'

interface MessageTemplate {
  id: string
  name: string
  category: string
  subject: string
  body: string
}

interface SendMessageModalProps {
  booking: CalendarBooking
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type MessageMethod = 'email' | 'sms'

export default function SendMessageModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: SendMessageModalProps) {
  const [method, setMethod] = useState<MessageMethod>('email')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const hasPhone = !!booking.guest_phone

  // Load templates on mount
  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen])

  async function loadTemplates() {
    try {
      const res = await fetch('/api/message-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  function applyTemplate(templateId: string) {
    const template = templates.find(t => t.id === templateId)
    if (!template) return

    // Replace placeholders with booking data
    const filledSubject = replacePlaceholders(template.subject)
    const filledBody = replacePlaceholders(template.body)

    setSubject(filledSubject)
    setMessage(filledBody)
    setSelectedTemplate(templateId)
  }

  function replacePlaceholders(text: string): string {
    return text
      .replace(/{guest_name}/g, booking.guest_name)
      .replace(/{date}/g, new Date(booking.scheduled_start).toLocaleDateString())
      .replace(/{time}/g, new Date(booking.scheduled_start).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))
      .replace(/{vessel}/g, booking.vessel?.name || 'Unknown')
      .replace(/{meeting_spot}/g, 'TBD')
  }

  async function handleSend() {
    // Validation
    if (method === 'email' && !subject.trim()) {
      setError('Subject is required for email')
      return
    }
    if (!message.trim()) {
      setError('Message is required')
      return
    }
    if (method === 'sms' && !hasPhone) {
      setError('Guest phone number not available')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const endpoint = method === 'email' 
        ? `/api/bookings/${booking.id}/send-message`
        : `/api/bookings/${booking.id}/send-sms`
      
      const payload = method === 'email'
        ? { subject, message, templateId: selectedTemplate }
        : { message, templateId: selectedTemplate }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to send ${method}`)
      }

      onSuccess()
      onClose()
      
      // Reset form
      setSubject('')
      setMessage('')
      setSelectedTemplate(null)
      setMethod('email')
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to send ${method}`)
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 rounded-lg">
              <Mail className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Send Message
              </h2>
              <p className="text-sm text-slate-400">
                To: {booking.guest_name} ({booking.guest_email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Method Selector (Email/SMS) */}
          <div className="flex gap-2 p-1 bg-white rounded-lg">
            <button
              onClick={() => setMethod('email')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors ${
                method === 'email'
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setMethod('sms')}
              disabled={!hasPhone}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium transition-colors ${
                method === 'sms'
                  ? 'bg-cyan-600 text-white'
                  : hasPhone 
                    ? 'text-slate-400 hover:text-slate-700'
                    : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              SMS {!hasPhone && '(No phone)'}
            </button>
          </div>

          {/* Template Selector */}
          {templates.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-2">
                <FileText className="w-4 h-4" />
                Use Template (optional)
              </label>
              <select
                value={selectedTemplate || ''}
                onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="">-- Select a template --</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-500">
                Available placeholders: {'{guest_name}'}, {'{date}'}, {'{time}'}, {'{vessel}'}, {'{meeting_spot}'}
              </p>
            </div>
          )}

          {/* Subject (Email only) */}
          {method === 'email' && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Subject <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
              Message <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={method === 'email' 
                ? "Type your message to the guest..." 
                : "Type your SMS message..."}
              rows={method === 'sms' ? 6 : 10}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none font-mono text-sm"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={
                method === 'sms' && message.length > 160
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }>
                {message.length} characters
                {method === 'sms' && message.length > 160 && (
                  <span className="ml-2">
                    ({Math.ceil(message.length / 160)} SMS segments)
                  </span>
                )}
              </span>
              {method === 'sms' && (
                <span className="text-slate-500">
                  {160 - (message.length % 160 || 160)} chars to next segment
                </span>
              )}
            </div>
            {method === 'sms' && message.length > 160 && (
              <p className="mt-1 text-xs text-amber-600">
                ⚠ Messages over 160 chars may be split into multiple SMS
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-white">
          <button
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={
              isSending || 
              !message.trim() || 
              (method === 'email' && !subject.trim()) ||
              (method === 'sms' && !hasPhone)
            }
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                {method === 'email' ? <Mail className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                Send {method === 'email' ? 'Email' : 'SMS'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
