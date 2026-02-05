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
  Edit2,
  ExternalLink,
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedPassenger, setExpandedPassenger] = useState<string | null>(null);

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

      setSuccess('Waiver reminders sent to guests who haven\'t signed');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminders');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const waiverUrl = guestToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/waivers/${guestToken.token}`
    : null;

  return (
    <section
      aria-label="Passenger Manifest"
      className="rounded-lg border border-slate-700 bg-slate-800/50 p-6 print:border-slate-300 print:bg-white"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-cyan-400 print:text-cyan-600">
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
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : signedCount > 0
                  ? 'bg-amber-500/20 text-amber-300'
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
        <div className="mb-4 flex items-center gap-2 rounded border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-400">
          <AlertCircle className="h-4 w-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded border border-emerald-500/50 bg-emerald-500/10 p-3 text-sm text-emerald-400">
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
              <div className="rounded-lg border border-dashed border-slate-600 p-6 text-center">
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
                    className="rounded-lg border border-slate-700 bg-slate-900/50 print:border-slate-300 print:bg-white"
                  >
                    {/* Passenger Header */}
                    <div
                      className="flex cursor-pointer items-center justify-between p-4 print:cursor-default"
                      onClick={() => setExpandedPassenger(isExpanded ? null : passenger.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-400 print:bg-slate-200">
                          <Users className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-200 print:text-black">
                              {passenger.full_name}
                            </span>
                            {passenger.is_primary_contact && (
                              <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-xs text-cyan-300">
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
                                ? 'bg-emerald-500/20 text-emerald-300'
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
                      <div className="border-t border-slate-700 p-4 print:border-slate-300">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Contact Info */}
                          <div className="space-y-2">
                            {passenger.email && (
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-slate-500" />
                                <a
                                  href={`mailto:${passenger.email}`}
                                  className="text-slate-300 hover:text-cyan-400"
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
                                  className="text-slate-300 hover:text-cyan-400"
                                >
                                  {passenger.phone}
                                </a>
                              </div>
                            )}
                          </div>

                          {/* Waiver Details */}
                          {activeWaiverTemplate && waiverStatus.status === 'signed' && waiverStatus.signature && (
                            <div className="rounded bg-emerald-500/10 p-3">
                              <div className="mb-1 text-xs font-medium text-emerald-400">
                                Waiver Signed
                              </div>
                              <div className="text-sm text-slate-300">
                                {format(parseISO(waiverStatus.signedAt!), 'MMM d, yyyy • h:mm a')}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                {waiverStatus.signature.waiver_template?.title} v{waiverStatus.signature.template_version}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {passenger.notes && (
                          <div className="mt-3 rounded bg-slate-800 p-3 print:bg-slate-100">
                            <div className="mb-1 text-xs font-medium text-slate-500">Notes</div>
                            <p className="text-sm text-slate-300 print:text-slate-700">
                              {passenger.notes}
                            </p>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-4 flex gap-2 print:hidden">
                          {waiverStatus.status === 'signed' && waiverStatus.signature && (
                            <button
                              onClick={() => window.open(`/api/waivers/${waiverStatus.signature!.id}/view`, '_blank')}
                              className="flex items-center gap-1.5 rounded border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
                            >
                              <Eye className="h-4 w-4" />
                              View Waiver
                            </button>
                          )}
                          <button
                            onClick={() => handleDeletePassenger(passenger.id)}
                            className="flex items-center gap-1.5 rounded border border-rose-500/30 px-3 py-1.5 text-sm text-rose-400 hover:bg-rose-500/10"
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
            <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/50 p-4 print:hidden">
              <h4 className="mb-3 font-medium text-slate-200">Add Passenger</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={newPassenger.full_name}
                  onChange={(e) => setNewPassenger({ ...newPassenger, full_name: e.target.value })}
                  placeholder="Full Name *"
                  className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="email"
                  value={newPassenger.email}
                  onChange={(e) => setNewPassenger({ ...newPassenger, email: e.target.value })}
                  placeholder="Email"
                  className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="tel"
                  value={newPassenger.phone}
                  onChange={(e) => setNewPassenger({ ...newPassenger, phone: e.target.value })}
                  placeholder="Phone"
                  className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={newPassenger.notes}
                  onChange={(e) => setNewPassenger({ ...newPassenger, notes: e.target.value })}
                  placeholder="Notes (allergies, accessibility, etc.)"
                  className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
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
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-3 print:hidden">
              <button
                onClick={() => setIsAddingPassenger(true)}
                className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
                <UserPlus className="h-4 w-4" />
                Add Passenger
              </button>

              {activeWaiverTemplate && signedCount < passengers.length && passengers.length > 0 && (
                <button
                  onClick={handleSendWaiverReminders}
                  disabled={isSendingReminders}
                  className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isSendingReminders ? 'Sending...' : 'Send Waiver Reminders'}
                </button>
              )}

              {waiverUrl && (
                <a
                  href={waiverUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                >
                  <ExternalLink className="h-4 w-4" />
                  Waiver Link
                </a>
              )}
            </div>
          )}

          {/* Waiver Template Info */}
          {activeWaiverTemplate && (
            <div className="mt-4 rounded bg-slate-900/30 p-3 text-sm print:bg-slate-100">
              <span className="text-slate-500">Active waiver: </span>
              <span className="text-slate-300 print:text-slate-700">
                {activeWaiverTemplate.title} (v{activeWaiverTemplate.version})
              </span>
            </div>
          )}
        </>
      )}
    </section>
  );
}
