'use client';

import { useState } from 'react';
import { Mail, X, Copy, Check, ExternalLink } from 'lucide-react';

interface SendEmailModalProps {
  guest: {
    name: string;
    email: string;
  };
  businessName: string;
  onClose: () => void;
}

export function SendEmailModal({ guest, businessName, onClose }: SendEmailModalProps) {
  const defaultSubject = `A message from ${businessName}`;
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(`Hi ${guest.name},\n\n`);
  const [emailCopied, setEmailCopied] = useState(false);

  const mailtoHref = `mailto:${encodeURIComponent(guest.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText(guest.email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      /* silent */
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="pointer-events-auto w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white p-6 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50">
                <Mail className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Send Email</h3>
                <p className="text-sm text-slate-400">Compose a message to {guest.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4 p-6">
            {/* To field */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">To</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
                  {guest.email}
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  {emailCopied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {emailCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Subject field */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Body field */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Message</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none"
                placeholder="Write your message..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-6">
            <button
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <a
              href={mailtoHref}
              className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-700"
            >
              <ExternalLink className="h-4 w-4" />
              Send via Email Client
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
