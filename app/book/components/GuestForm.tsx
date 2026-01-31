'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Users, MapPin, MessageSquare, Plus, Trash2, Gift } from 'lucide-react';
import { MAX_PARTY_SIZE } from '@/lib/db/types';

export interface PassengerInfo {
  full_name: string;
  email: string;
  phone: string;
}

export interface GuestFormData {
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  party_size: number;
  passengers: PassengerInfo[];
  special_requests: string;
  referral_code?: string;
}

interface GuestFormProps {
  initialData?: Partial<GuestFormData>;
  meetingSpotName: string | null;
  meetingSpotAddress: string | null;
  meetingSpotInstructions: string | null;
  onSubmit: (data: GuestFormData) => void;
  isSubmitting: boolean;
  submitError: string | null;
}

export function GuestForm({
  initialData,
  meetingSpotName,
  meetingSpotAddress,
  meetingSpotInstructions,
  onSubmit,
  isSubmitting,
  submitError,
}: GuestFormProps) {
  const [formData, setFormData] = useState<GuestFormData>({
    guest_name: initialData?.guest_name || '',
    guest_email: initialData?.guest_email || '',
    guest_phone: initialData?.guest_phone || '',
    party_size: initialData?.party_size || 1,
    passengers: initialData?.passengers || [],
    special_requests: initialData?.special_requests || '',
    referral_code: initialData?.referral_code || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof GuestFormData, string>>>({});

  // Sync passengers array with party size
  useEffect(() => {
    const additionalPassengerCount = formData.party_size - 1; // Subtract 1 for primary contact

    if (formData.passengers.length < additionalPassengerCount) {
      // Add empty passenger slots
      const newPassengers = [...formData.passengers];
      while (newPassengers.length < additionalPassengerCount) {
        newPassengers.push({ full_name: '', email: '', phone: '' });
      }
      setFormData((prev) => ({ ...prev, passengers: newPassengers }));
    } else if (formData.passengers.length > additionalPassengerCount) {
      // Remove excess passenger slots
      setFormData((prev) => ({
        ...prev,
        passengers: prev.passengers.slice(0, additionalPassengerCount),
      }));
    }
  }, [formData.party_size, formData.passengers.length]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof GuestFormData, string>> = {};

    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Name is required';
    }

    if (!formData.guest_email.trim()) {
      newErrors.guest_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      newErrors.guest_email = 'Please enter a valid email';
    }

    if (!formData.guest_phone.trim()) {
      newErrors.guest_phone = 'Phone number is required';
    }

    if (formData.party_size < 1 || formData.party_size > MAX_PARTY_SIZE) {
      newErrors.party_size = `Party size must be between 1 and ${MAX_PARTY_SIZE}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) => {
    const newPassengers = [...formData.passengers];
    newPassengers[index] = { ...newPassengers[index], [field]: value };
    setFormData((prev) => ({ ...prev, passengers: newPassengers }));
  };

  const inputClasses = `
    w-full rounded-md border border-slate-700 bg-slate-800 px-4 py-3 text-white
    placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1
    focus:ring-cyan-500 transition-colors
  `;

  const labelClasses = 'block text-sm font-medium text-slate-300 mb-2';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Primary Contact Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-400" />
          Primary Contact
        </h3>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="guest_name" className={labelClasses}>
              Full Name *
            </label>
            <input
              type="text"
              id="guest_name"
              value={formData.guest_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, guest_name: e.target.value }))}
              className={inputClasses}
              placeholder="John Smith"
            />
            {errors.guest_name && (
              <p className="mt-1 text-sm text-rose-400">{errors.guest_name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="guest_email" className={labelClasses}>
              Email Address *
            </label>
            <div className="relative">
              <input
                type="email"
                id="guest_email"
                value={formData.guest_email}
                onChange={(e) => setFormData((prev) => ({ ...prev, guest_email: e.target.value }))}
                className={inputClasses}
                placeholder="john@example.com"
              />
            </div>
            {errors.guest_email && (
              <p className="mt-1 text-sm text-rose-400">{errors.guest_email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="guest_phone" className={labelClasses}>
              Phone Number *
            </label>
            <input
              type="tel"
              id="guest_phone"
              value={formData.guest_phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, guest_phone: e.target.value }))}
              className={inputClasses}
              placeholder="(555) 123-4567"
            />
            {errors.guest_phone && (
              <p className="mt-1 text-sm text-rose-400">{errors.guest_phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Party Size Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-cyan-400" />
          Party Size
        </h3>

        <div>
          <label htmlFor="party_size" className={labelClasses}>
            Number of Guests (including yourself) *
          </label>
          <div className="flex items-center gap-4">
            <select
              id="party_size"
              value={formData.party_size}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, party_size: parseInt(e.target.value, 10) }))
              }
              className={`${inputClasses} w-32`}
            >
              {Array.from({ length: MAX_PARTY_SIZE }, (_, i) => i + 1).map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
            <span className="text-sm text-slate-400">
              Maximum {MAX_PARTY_SIZE} guests (USCG 6-pack limit)
            </span>
          </div>
          {errors.party_size && (
            <p className="mt-1 text-sm text-rose-400">{errors.party_size}</p>
          )}
        </div>
      </div>

      {/* Additional Passengers Section */}
      {formData.party_size > 1 && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            Additional Passengers
            <span className="text-sm font-normal text-slate-400">(Optional)</span>
          </h3>

          <div className="space-y-6">
            {formData.passengers.map((passenger, index) => (
              <div
                key={index}
                className="rounded-md border border-slate-700 bg-slate-800/50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-300">
                    Passenger {index + 2}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <input
                      type="text"
                      value={passenger.full_name}
                      onChange={(e) => updatePassenger(index, 'full_name', e.target.value)}
                      className={inputClasses}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      value={passenger.email}
                      onChange={(e) => updatePassenger(index, 'email', e.target.value)}
                      className={inputClasses}
                      placeholder="Email (optional)"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      value={passenger.phone}
                      onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                      className={inputClasses}
                      placeholder="Phone (optional)"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meeting Location Section */}
      {(meetingSpotName || meetingSpotAddress) && (
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cyan-400" />
            Meeting Location
          </h3>

          <div className="space-y-2">
            {meetingSpotName && (
              <p className="text-white font-medium">{meetingSpotName}</p>
            )}
            {meetingSpotAddress && (
              <p className="text-slate-400">{meetingSpotAddress}</p>
            )}
            {meetingSpotInstructions && (
              <p className="text-sm text-slate-500 mt-2">{meetingSpotInstructions}</p>
            )}
          </div>
        </div>
      )}

      {/* Special Requests Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-cyan-400" />
          Special Requests
          <span className="text-sm font-normal text-slate-400">(Optional)</span>
        </h3>

        <textarea
          id="special_requests"
          value={formData.special_requests}
          onChange={(e) => setFormData((prev) => ({ ...prev, special_requests: e.target.value }))}
          className={`${inputClasses} min-h-[100px] resize-y`}
          placeholder="Any special requests, dietary restrictions, or things we should know about?"
          maxLength={2000}
        />
        <p className="mt-1 text-xs text-slate-500">
          {formData.special_requests.length}/2000 characters
        </p>
      </div>

      {/* Referral Code Section */}
      <div className="rounded-lg border border-slate-700 bg-slate-900 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-cyan-400" />
          Referral Code
          <span className="text-sm font-normal text-slate-400">(Optional)</span>
        </h3>

        <div>
          <input
            type="text"
            id="referral_code"
            value={formData.referral_code || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, referral_code: e.target.value.toUpperCase() }))}
            className={inputClasses}
            placeholder="Enter referral code (e.g., SARAH2024)"
            maxLength={20}
          />
          <p className="mt-1 text-xs text-slate-500">
            Have a referral code? Enter it here to receive your discount!
          </p>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-md bg-rose-500/10 border border-rose-500/20 px-4 py-3">
          <p className="text-sm text-rose-400">{submitError}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`
          w-full py-4 rounded-lg font-semibold text-lg transition-all
          ${isSubmitting
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-cyan-500 text-white hover:bg-cyan-600 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
          }
        `}
      >
        {isSubmitting ? 'Processing...' : 'Continue to Review'}
      </button>
    </form>
  );
}
