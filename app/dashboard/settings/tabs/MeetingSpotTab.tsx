'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader2,
  Save,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { Profile } from '@/lib/db/types';
import { updateProfile } from '@/app/actions/profile';

interface MeetingSpotTabProps {
  initialProfile: Profile | null;
}

export function MeetingSpotTab({ initialProfile }: MeetingSpotTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [meetingSpotName, setMeetingSpotName] = useState(initialProfile?.meeting_spot_name || '');
  const [meetingSpotAddress, setMeetingSpotAddress] = useState(initialProfile?.meeting_spot_address || '');
  const [meetingSpotInstructions, setMeetingSpotInstructions] = useState(initialProfile?.meeting_spot_instructions || '');
  const [savedAddress, setSavedAddress] = useState(initialProfile?.meeting_spot_address || '');
  const [meetingSpotLat, setMeetingSpotLat] = useState<number | null>(initialProfile?.meeting_spot_latitude ?? null);
  const [meetingSpotLon, setMeetingSpotLon] = useState<number | null>(initialProfile?.meeting_spot_longitude ?? null);
  const [geocodeStatus, setGeocodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');

  const hasChanges = useMemo(() => {
    return (
      meetingSpotName !== (initialProfile?.meeting_spot_name || '') ||
      meetingSpotAddress !== (initialProfile?.meeting_spot_address || '') ||
      meetingSpotInstructions !== (initialProfile?.meeting_spot_instructions || '') ||
      meetingSpotLat !== (initialProfile?.meeting_spot_latitude ?? null) ||
      meetingSpotLon !== (initialProfile?.meeting_spot_longitude ?? null)
    );
  }, [meetingSpotName, meetingSpotAddress, meetingSpotInstructions, meetingSpotLat, meetingSpotLon, initialProfile]);

  const handleSave = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      let lat = meetingSpotLat;
      let lon = meetingSpotLon;

      // Auto-geocode if address changed since last save
      const addressChanged = meetingSpotAddress.trim() !== savedAddress.trim();
      if (addressChanged && meetingSpotAddress.trim()) {
        setGeocodeStatus('loading');
        setGeocodeMessage(null);
        try {
          const res = await fetch(`/api/geocode?address=${encodeURIComponent(meetingSpotAddress.trim())}`);
          const data = await res.json();
          if (res.ok && data.lat && data.lon) {
            lat = data.lat;
            lon = data.lon;
            setMeetingSpotLat(lat);
            setMeetingSpotLon(lon);
            setGeocodeStatus('success');
            setGeocodeMessage(`Matched: ${data.matchedAddress}`);
          } else {
            setGeocodeStatus('error');
            setGeocodeMessage(data.error || 'Geocoding failed');
          }
        } catch {
          setGeocodeStatus('error');
          setGeocodeMessage('Geocoding service unavailable');
        }
      }

      const result = await updateProfile({
        meeting_spot_name: meetingSpotName || null,
        meeting_spot_address: meetingSpotAddress || null,
        meeting_spot_instructions: meetingSpotInstructions || null,
        meeting_spot_latitude: lat,
        meeting_spot_longitude: lon,
      });

      if (result.success) {
        setSavedAddress(meetingSpotAddress);
        setSuccess('Meeting spot saved successfully');
        router.refresh();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to save meeting spot');
      }
    });
  };

  const handleManualCoordsSubmit = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      setGeocodeStatus('error');
      setGeocodeMessage('Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180.');
      return;
    }
    setMeetingSpotLat(lat);
    setMeetingSpotLon(lon);
    setGeocodeStatus('success');
    setGeocodeMessage('Coordinates set manually');
    setShowManualCoords(false);
  };

  const inputClassName = "w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 placeholder-slate-500 transition-colors focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500";
  const labelClassName = "block text-sm font-medium text-slate-600 mb-1.5";
  const sectionClassName = "rounded-xl border border-slate-200 bg-white p-6";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}

      <section className={sectionClassName}>
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-600" />
          <h2 className="text-lg font-semibold text-slate-900">Meeting Spot</h2>
        </div>
        <p className="mb-4 text-sm text-slate-400">
          Where should guests meet you for trips? This information is shared after booking.
        </p>
        <div className="space-y-4">
          <div>
            <label htmlFor="meetingSpotName" className={labelClassName}>
              Location Name
            </label>
            <input
              id="meetingSpotName"
              type="text"
              value={meetingSpotName}
              onChange={(e) => setMeetingSpotName(e.target.value)}
              placeholder="Harbor Marina - Dock 7"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="meetingSpotAddress" className={labelClassName}>
              Address
            </label>
            <input
              id="meetingSpotAddress"
              type="text"
              value={meetingSpotAddress}
              onChange={(e) => setMeetingSpotAddress(e.target.value)}
              placeholder="123 Harbor Road, Marina Bay, FL 33139"
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="meetingSpotInstructions" className={labelClassName}>
              Instructions for Guests
            </label>
            <textarea
              id="meetingSpotInstructions"
              value={meetingSpotInstructions}
              onChange={(e) => setMeetingSpotInstructions(e.target.value)}
              placeholder="Park in the marina lot and walk to Dock 7. Look for the blue and white boat named 'Sea Quest'. Call me when you arrive."
              rows={3}
              className={inputClassName}
            />
          </div>

          {/* Coordinate Status & Weather Location */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Weather Location</span>
              {geocodeStatus === 'loading' && (
                <span className="flex items-center gap-1.5 text-xs text-cyan-600">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Geocoding...
                </span>
              )}
            </div>

            {meetingSpotLat !== null && meetingSpotLon !== null ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                <span className="text-sm text-emerald-600">
                  {meetingSpotLat.toFixed(4)}, {meetingSpotLon.toFixed(4)} — Location verified
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <span className="text-sm text-amber-600">
                  No coordinates set — save with an address to auto-detect, or enter manually below
                </span>
              </div>
            )}

            {geocodeStatus === 'error' && geocodeMessage && (
              <div className="flex items-start gap-2 rounded-md bg-rose-50 border border-rose-500/20 px-3 py-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
                <span className="text-xs text-rose-600">{geocodeMessage}</span>
              </div>
            )}

            {geocodeStatus === 'success' && geocodeMessage && (
              <p className="text-xs text-slate-500">{geocodeMessage}</p>
            )}

            <button
              type="button"
              onClick={() => setShowManualCoords(!showManualCoords)}
              className="text-xs text-cyan-600 hover:text-cyan-600 transition-colors"
            >
              {showManualCoords ? 'Hide manual entry' : 'Enter coordinates manually'}
            </button>

            {showManualCoords && (
              <div className="space-y-3 pt-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="manualLat" className="block text-xs font-medium text-slate-400 mb-1">
                      Latitude
                    </label>
                    <input
                      id="manualLat"
                      type="number"
                      step="any"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      placeholder="e.g. 39.2815"
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="manualLon" className="block text-xs font-medium text-slate-400 mb-1">
                      Longitude
                    </label>
                    <input
                      id="manualLon"
                      type="number"
                      step="any"
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                      placeholder="e.g. -76.5925"
                      className={inputClassName}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualCoordsSubmit}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Set Coordinates
                </button>
                <p className="text-xs text-slate-500">
                  Tip: Find coordinates on Google Maps by right-clicking your location.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {hasChanges && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600">
            <AlertCircle className="h-4 w-4" />
            Unsaved changes
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isPending || !hasChanges}
          className="group flex items-center gap-2 rounded-lg bg-cyan-600 px-6 py-2.5 text-sm font-medium text-white transition-all duration-75 hover:bg-cyan-500 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            boxShadow: hasChanges ? '0 4px 14px rgba(34, 211, 238, 0.25)' : undefined,
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isPending ? 'Saving...' : 'Save Meeting Spot'}
        </button>
      </div>
    </div>
  );
}
