'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Users,
  UserPlus,
  FileCheck,
  FileX,
  Clock,
  Send,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  ExternalLink,
  Download,
  Bell,
  Image as ImageIcon,
} from 'lucide-react';
import { Passenger, WaiverSignature } from '@/lib/db/types';

interface WaiverSignatureWithTemplate extends WaiverSignature {
  waiver_template: {
    id: string;
    title: string;
    version: number;
  } | null;
}

interface PassengerManifestProps {
  bookingId: string;
  passengers: Passenger[];
  waiverSignatures: WaiverSignatureWithTemplate[];
  activeWaiverTemplate: { id: string; title: string; version: number } | null;
  guestToken: { token: string; expires_at: string } | null;
  partySize: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export function PassengerManifest({
  bookingId,
  passengers,
  waiverSignatures,
  activeWaiverTemplate,
  guestToken,
  partySize,
  isLoading,
  onRefresh,
}: PassengerManifestProps) {
  const [isAddingPassenger, setIsAddingPassenger] = useState(false);
  const [newPassenger, setNewPassenger] = useState({ full_name: '', email: '', phone: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedPassenger, setExpandedPassenger] = useState<string | null>(null);
  const [viewingSignature, setViewingSignature] = useState<WaiverSignatureWithTemplate | null>(null);

  // Get waiver status for a passenger
  const getWaiverStatus = (passenger: Passenger) => {
    const signature = waiverSignatures.find(
      (ws) => ws.passenger_id === passenger.id ||
        (ws.signer_email && ws.signer_email.toLowerCase() === passenger.email?.toLowerCase())
    );

    if (signature) {
      return {
        status: 'signed' as const,
        signature,
        signedAt: signature.signed_at,
      };
    }

    return {
      status: 'not_signed' as const,
      signature: null,
      signedAt: null,
    };
  };

  // Count signed waivers
  const signedCount = passengers.filter((p) => getWaiverStatus(p).status === 'signed').length;
  const totalNeeded = passengers.length || partySize;

  const handleAddPassenger = async () => {
    if (!newPassenger.full_name.trim()) {
      setError('Passenger name is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/passengers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: newPassenger.full_name.trim(),
          email: newPassenger.email.trim() || null,
          phone: newPassenger.phone.trim() || null,
          notes: newPassenger.notes.trim() || null,
          is_primary_contact: passengers.length === 0,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add passenger');
      }

      setNewPassenger({ full_name: '', email: '', phone: '', notes: '' });
      setIsAddingPassenger(false);
      setSuccess('Passenger added');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add passenger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePassenger = async (passengerId: string) => {
    if (!confirm('Remove this passenger from the manifest?')) {
      return;
    }

    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/passengers/${passengerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove passenger');
      }

      setSuccess('Passenger removed');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove passenger');
    }
  };

  const handleSendWaiverReminders = async () => {
    setIsSendingReminders(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/send-waiver-reminders`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reminders');
      }

      const data = await response.json();
      setSuccess(data.message || 'Waiver reminders sent to guests who haven\'t signed');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminders');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleSendIndividualReminder = async (passengerId: string) => {
    setSendingReminderId(passengerId);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/send-waiver-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reminder');
      }

      setSuccess('Reminder sent successfully');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setSendingReminderId(null);
    }
  };

  const waiverUrl = guestToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/waivers/${guestToken.token}`
    : null;

  return (
    <>
      <section
        aria-label="Passenger Manifest"
        className="rounded-lg border border-slate-200 bg-white p-6 print:border-slate-300 print:bg-white"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-600 print:text-cyan-600">
              <Users className="h-5 w-5" />
              Passenger Manifest
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {passengers.length} of {partySize} passengers registered
            </p>
          </div>

          {/* Waiver Summary Badge */}
          <div className="flex items-center gap-2">
            {activeWaiverTemplate && (
              <span
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                  signedCount === totalNeeded
                    ? 'bg-emerald-50 text-emerald-600'
                    : signedCount > 0
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                <FileCheck className="h-4 w-4" />
                {signedCount}/{totalNeeded} waivers
              </span>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded border border-rose-500/50 bg-rose-50 p-3 text-sm text-rose-600">
            <AlertCircle className="h-4 w-4" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto hover:underline">
              Dismiss
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded border border-emerald-500/50 bg-emerald-50 p-3 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            {success}
            <button onClick={() => setSuccess(null)} className="ml-auto hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Passenger List */}
            <div className="space-y-3">
              {passengers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
                  <Users className="mx-auto mb-2 h-8 w-8 text-slate-500" />
                  <p className="text-slate-400">No passengers registered yet</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Add passengers to track waivers and create a manifest
                  </p>
                </div>
              ) : (
                passengers.map((passenger) => {
                  const waiverStatus = getWaiverStatus(passenger);
                  const isExpanded = expandedPassenger === passenger.id;

                  return (
                    <div
                      key={passenger.id}
                      className="rounded-lg border border-slate-200 bg-white print:border-slate-300 print:bg-white"
                    >
                      {/* Passenger Header */}
                      <div
                        className="flex cursor-pointer items-center justify-between p-4 print:cursor-default"
                        onClick={() => setExpandedPassenger(isExpanded ? null : passenger.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 print:bg-slate-200">
                            <Users className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700 print:text-black">
                                {passenger.full_name}
                              </span>
                              {passenger.is_primary_contact && (
                                <span className="rounded bg-cyan-50 px-1.5 py-0.5 text-xs text-cyan-600">
                                  Primary
                                </span>
                              )}
                            </div>
                            {passenger.email && (
                              <span className="text-sm text-slate-500">{passenger.email}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Waiver Status */}
                          {activeWaiverTemplate && (
                            <span
                              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                                waiverStatus.status === 'signed'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-slate-500/20 text-slate-400'
                              }`}
                            >
                              {waiverStatus.status === 'signed' ? (
                                <>
                                  <FileCheck className="h-3 w-3" />
                                  Signed
                                </>
                              ) : (
                                <>
                                  <FileX className="h-3 w-3" />
                                  Not signed
                                </>
                              )}
                            </span>
                          )}

                          {/* Expand/Collapse */}
                          <span className="print:hidden">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-slate-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-slate-500" />
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 p-4 print:border-slate-300">
                          <div className="grid gap-4 sm:grid-cols-2">
                            {/* Contact Info */}
                            <div className="space-y-2">
                              {passenger.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-slate-500" />
                                  <a
                                    href={`mailto:${passenger.email}`}
                                    className="text-slate-600 hover:text-cyan-600"
                                  >
                                    {passenger.email}
                                  </a>
                                </div>
                              )}
                              {passenger.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-4 w-4 text-slate-500" />
                                  <a
                                    href={`tel:${passenger.phone}`}
                                    className="text-slate-600 hover:text-cyan-600"
                                  >
                                    {passenger.phone}
                                  </a>
                                </div>
                              )}
                            </div>

                            {/* Waiver Details with Signature Preview */}
                            {activeWaiverTemplate && waiverStatus.status === 'signed' && waiverStatus.signature && (
                              <div className="rounded bg-emerald-50 p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-xs font-medium text-emerald-600">
                                    Waiver Signed
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setViewingSignature(waiverStatus.signature);
                                    }}
                                    className="text-xs text-cyan-600 hover:text-cyan-600 flex items-center gap-1"
                                  >
                                    <Eye className="h-3 w-3" />
                                    View
                                  </button>
                                </div>
                                {/* Signature Thumbnail */}
                                {waiverStatus.signature.signature_data && (
                                  <div className="rounded bg-white p-2 border border-slate-300">
                                    <img
                                      src={waiverStatus.signature.signature_data}
                                      alt={`Signature of ${passenger.full_name}`}
                                      className="h-12 w-auto object-contain mx-auto"
                                    />
                                  </div>
                                )}
                                <div className="text-sm text-slate-600">
                                  {format(parseISO(waiverStatus.signedAt!), 'MMM d, yyyy • h:mm a')}
                                </div>
                                <div className="text-xs text-slate-500">
                                  {waiverStatus.signature.waiver_template?.title} v{waiverStatus.signature.template_version}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {passenger.notes && (
                            <div className="mt-3 rounded bg-white p-3 print:bg-slate-100">
                              <div className="mb-1 text-xs font-medium text-slate-500">Notes</div>
                              <p className="text-sm text-slate-600 print:text-slate-700">
                                {passenger.notes}
                              </p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="mt-4 flex flex-wrap gap-2 print:hidden">
                            {waiverStatus.status === 'signed' && waiverStatus.signature && (
                              <>
                                <button
                                  onClick={() => setViewingSignature(waiverStatus.signature)}
                                  className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Full Waiver
                                </button>
                                <a
                                  href={`/api/waivers/${waiverStatus.signature.id}/pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 rounded border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-white"
                                >
                                  <Download className="h-4 w-4" />
                                  Download PDF
                                </a>
                              </>
                            )}
                            {waiverStatus.status === 'not_signed' && activeWaiverTemplate && passenger.email && (
                              <button
                                onClick={() => handleSendIndividualReminder(passenger.id)}
                                disabled={sendingReminderId === passenger.id}
                                className="flex items-center gap-1.5 rounded border border-amber-500/30 bg-amber-50 px-3 py-1.5 text-sm text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                              >
                                {sendingReminderId === passenger.id ? (
                                  <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Bell className="h-4 w-4" />
                                    Send Reminder
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePassenger(passenger.id)}
                              className="flex items-center gap-1.5 rounded border border-rose-500/30 px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Passenger Form */}
            {isAddingPassenger ? (
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 print:hidden">
                <h4 className="mb-3 font-medium text-slate-700">Add Passenger</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={newPassenger.full_name}
                    onChange={(e) => setNewPassenger({ ...newPassenger, full_name: e.target.value })}
                    placeholder="Full Name *"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <input
                    type="email"
                    value={newPassenger.email}
                    onChange={(e) => setNewPassenger({ ...newPassenger, email: e.target.value })}
                    placeholder="Email"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <input
                    type="tel"
                    value={newPassenger.phone}
                    onChange={(e) => setNewPassenger({ ...newPassenger, phone: e.target.value })}
                    placeholder="Phone"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newPassenger.notes}
                    onChange={(e) => setNewPassenger({ ...newPassenger, notes: e.target.value })}
                    placeholder="Notes (allergies, accessibility, etc.)"
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-700 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleAddPassenger}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
                  >
                    {isSaving ? 'Adding...' : 'Add Passenger'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingPassenger(false);
                      setNewPassenger({ full_name: '', email: '', phone: '', notes: '' });
                    }}
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3 print:hidden">
                <button
                  onClick={() => setIsAddingPassenger(true)}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <UserPlus className="h-4 w-4" />
                  Add Passenger
                </button>

                {activeWaiverTemplate && signedCount < passengers.length && passengers.length > 0 && (
                  <button
                    onClick={handleSendWaiverReminders}
                    disabled={isSendingReminders}
                    className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    {isSendingReminders ? 'Sending...' : 'Send All Reminders'}
                  </button>
                )}

                {waiverUrl && (
                  <a
                    href={waiverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-400 hover:bg-white hover:text-slate-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Waiver Link
                  </a>
                )}
              </div>
            )}

            {/* Waiver Template Info */}
            {activeWaiverTemplate && (
              <div className="mt-4 rounded bg-slate-50 p-3 text-sm print:bg-slate-100">
                <span className="text-slate-500">Active waiver: </span>
                <span className="text-slate-600 print:text-slate-700">
                  {activeWaiverTemplate.title} (v{activeWaiverTemplate.version})
                </span>
              </div>
            )}
          </>
        )}
      </section>

      {/* Full Waiver View Modal */}
      {viewingSignature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg border border-slate-200 bg-white">
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {viewingSignature.waiver_template?.title || 'Signed Waiver'}
                </h3>
                <p className="text-sm text-slate-400">
                  Signed by {viewingSignature.signer_name} on{' '}
                  {format(parseISO(viewingSignature.signed_at), 'MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
              <button
                onClick={() => setViewingSignature(null)}
                className="p-2 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-white"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Signature Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">Signer Name</div>
                  <div className="text-slate-700">{viewingSignature.signer_name}</div>
                </div>
                {viewingSignature.signer_email && (
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="text-slate-700">{viewingSignature.signer_email}</div>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">Signed At</div>
                  <div className="text-slate-700">
                    {format(parseISO(viewingSignature.signed_at), 'PPpp')}
                  </div>
                </div>
                {viewingSignature.ip_address && (
                  <div className="space-y-1">
                    <div className="text-xs text-slate-500">IP Address</div>
                    <div className="text-slate-700 font-mono text-sm">
                      {viewingSignature.ip_address}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-xs text-slate-500">Template Version</div>
                  <div className="text-slate-700">v{viewingSignature.template_version}</div>
                </div>
              </div>

              {/* Signature Image */}
              {viewingSignature.signature_data && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">Signature</div>
                  <div className="rounded-lg bg-white p-4 border border-slate-300">
                    <img
                      src={viewingSignature.signature_data}
                      alt={`Signature of ${viewingSignature.signer_name}`}
                      className="max-h-32 w-auto mx-auto"
                    />
                  </div>
                </div>
              )}

              {/* Device Info if available */}
              {viewingSignature.device_info && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-500">Device Information</div>
                  <div className="rounded bg-white p-3 text-xs font-mono text-slate-400 space-y-1">
                    <div>Platform: {viewingSignature.device_info.platform}</div>
                    <div>Screen: {viewingSignature.device_info.screen_width}x{viewingSignature.device_info.screen_height}</div>
                    <div>Language: {viewingSignature.device_info.language}</div>
                    <div>Timezone: {viewingSignature.device_info.timezone}</div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <a
                  href={`/api/waivers/${viewingSignature.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-400"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
                <button
                  onClick={() => setViewingSignature(null)}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
