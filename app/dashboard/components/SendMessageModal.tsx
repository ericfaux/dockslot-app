'use client'

import { useState, useEffect } from 'react'
import { X, Send, Mail, FileText, Loader2 } from 'lucide-react'
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

export default function SendMessageModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: SendMessageModalProps) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required')
      return
    }

    setIsSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/bookings/${booking.id}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          templateId: selectedTemplate,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send message')
      }

      onSuccess()
      onClose()
      
      // Reset form
      setSubject('')
      setMessage('')
      setSelectedTemplate(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-cyan-900/20 to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <Mail className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Send Message
              </h2>
              <p className="text-sm text-slate-400">
                To: {booking.guest_name} ({booking.guest_email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Template Selector */}
          {templates.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <FileText className="w-4 h-4" />
                Use Template (optional)
              </label>
              <select
                value={selectedTemplate || ''}
                onChange={(e) => e.target.value && applyTemplate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
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

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Subject <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Message <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message to the guest..."
              rows={10}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none font-mono text-sm"
            />
            <p className="mt-2 text-xs text-slate-500">
              {message.length} characters
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700 bg-slate-900/50">
          <button
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending || !subject.trim() || !message.trim()}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
