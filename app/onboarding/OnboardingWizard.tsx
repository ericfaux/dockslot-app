'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Anchor, Ship, Calendar, Check, ArrowRight, ArrowLeft,
  MapPin, Phone, Clock, User, Loader2, Copy, ExternalLink,
  ChevronRight, Globe, Sailboat,
} from 'lucide-react'
import {
  saveProfileStep,
  saveMeetingSpotStep,
  saveVesselStep,
  saveTripTypeStep,
  saveAvailabilityStep,
  updateOnboardingStep,
  completeOnboarding,
} from '@/app/actions/onboarding'

// ============================================================================
// Types
// ============================================================================

interface OnboardingWizardProps {
  profile: Record<string, unknown>
  userEmail: string
  userId: string
}

interface TripTemplate {
  title: string
  duration: number
  price: number
  deposit: number
}

// ============================================================================
// Constants
// ============================================================================

const STEPS = [
  { id: 0, title: 'Welcome', shortTitle: 'Profile' },
  { id: 1, title: 'Meeting Spot', shortTitle: 'Location' },
  { id: 2, title: 'Vessel', shortTitle: 'Boat' },
  { id: 3, title: 'Trip Type', shortTitle: 'Trip' },
  { id: 4, title: 'Availability', shortTitle: 'Schedule' },
  { id: 5, title: 'Share Link', shortTitle: 'Share' },
]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Puerto_Rico', label: 'Atlantic Time (AST)' },
]

const TRIP_TEMPLATES: TripTemplate[] = [
  { title: 'Inshore Fishing', duration: 4, price: 600, deposit: 150 },
  { title: 'Offshore Charter', duration: 8, price: 1200, deposit: 300 },
  { title: 'Sunset Cruise', duration: 3, price: 450, deposit: 100 },
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ============================================================================
// Component
// ============================================================================

export default function OnboardingWizard({ profile, userEmail, userId }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(
    Math.min((profile.onboarding_step as number) || 0, 5)
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 0: Welcome & Profile
  const [fullName, setFullName] = useState((profile.full_name as string) || '')
  const [businessName, setBusinessName] = useState((profile.business_name as string) || '')
  const [phone, setPhone] = useState((profile.phone as string) || '')
  const [timezone, setTimezone] = useState((profile.timezone as string) || 'America/New_York')

  // Step 1: Meeting Spot
  const [locationName, setLocationName] = useState((profile.meeting_spot_name as string) || '')
  const [locationAddress, setLocationAddress] = useState((profile.meeting_spot_address as string) || '')
  const [geoLat, setGeoLat] = useState<number | null>((profile.meeting_spot_latitude as number) || null)
  const [geoLon, setGeoLon] = useState<number | null>((profile.meeting_spot_longitude as number) || null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [geoAddress, setGeoAddress] = useState<string | null>(null)

  // Step 2: Vessel
  const [vesselName, setVesselName] = useState('')
  const [passengerCapacity, setPassengerCapacity] = useState(6)

  // Step 3: Trip Type
  const [tripTitle, setTripTitle] = useState('')
  const [durationHours, setDurationHours] = useState(4)
  const [totalPrice, setTotalPrice] = useState(600)
  const [depositAmount, setDepositAmount] = useState(150)
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null)

  // Step 4: Availability
  const [availability, setAvailability] = useState(() => {
    return Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      start_time: '06:00',
      end_time: '18:00',
      // Mon-Sat active by default (Sunday index 0 is off)
      is_active: i !== 0,
    }))
  })

  // Step 5: Share Link
  const [linkCopied, setLinkCopied] = useState(false)

  // Track which steps were skipped
  const [skippedSteps, setSkippedSteps] = useState<Set<number>>(new Set())

  // ============================================================================
  // Geocoding
  // ============================================================================

  const geocodeAddress = useCallback(async (address: string) => {
    if (!address || address.trim().length < 5) return
    setGeoStatus('loading')
    setGeoAddress(null)

    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`)
      if (!res.ok) {
        setGeoStatus('error')
        return
      }
      const data = await res.json()
      setGeoLat(data.lat)
      setGeoLon(data.lon)
      setGeoAddress(data.matchedAddress)
      setGeoStatus('success')
    } catch {
      setGeoStatus('error')
    }
  }, [])

  // ============================================================================
  // Step Navigation
  // ============================================================================

  async function handleNext() {
    setError(null)
    setIsSaving(true)

    try {
      if (currentStep === 0) {
        const result = await saveProfileStep({
          full_name: fullName,
          business_name: businessName,
          phone,
          timezone,
        })
        if (!result.success) throw new Error(result.error)
      } else if (currentStep === 1) {
        const result = await saveMeetingSpotStep({
          meeting_spot_name: locationName,
          meeting_spot_address: locationAddress,
          meeting_spot_latitude: geoLat,
          meeting_spot_longitude: geoLon,
        })
        if (!result.success) throw new Error(result.error)
      } else if (currentStep === 2) {
        const result = await saveVesselStep({
          name: vesselName,
          capacity: passengerCapacity,
        })
        if (!result.success) throw new Error(result.error)
      } else if (currentStep === 3) {
        const result = await saveTripTypeStep({
          title: tripTitle,
          duration_hours: durationHours,
          price_total: totalPrice,
          deposit_amount: depositAmount,
        })
        if (!result.success) throw new Error(result.error)
      } else if (currentStep === 4) {
        const result = await saveAvailabilityStep(availability)
        if (!result.success) throw new Error(result.error)
      } else if (currentStep === 5) {
        // Final step - mark onboarding complete
        const result = await completeOnboarding()
        if (!result.success) throw new Error(result.error)
        router.push('/dashboard')
        return
      }

      setCurrentStep(prev => Math.min(prev + 1, 5))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSkip() {
    setError(null)
    setSkippedSteps(prev => new Set(prev).add(currentStep))

    // Still advance the step tracker in the DB
    const nextStep = currentStep + 1
    await updateOnboardingStep(nextStep)
    setCurrentStep(nextStep)
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
      setError(null)
    }
  }

  function applyTemplate(index: number) {
    const t = TRIP_TEMPLATES[index]
    setSelectedTemplate(index)
    setTripTitle(t.title)
    setDurationHours(t.duration)
    setTotalPrice(t.price)
    setDepositAmount(t.deposit)
  }

  function toggleDay(dayIndex: number) {
    setAvailability(prev =>
      prev.map(d =>
        d.day_of_week === dayIndex ? { ...d, is_active: !d.is_active } : d
      )
    )
  }

  function updateDayTime(dayIndex: number, field: 'start_time' | 'end_time', value: string) {
    setAvailability(prev =>
      prev.map(d =>
        d.day_of_week === dayIndex ? { ...d, [field]: value } : d
      )
    )
  }

  async function handleCopyLink() {
    const url = `${window.location.origin}/book/${userId}`
    try {
      await navigator.clipboard.writeText(url)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const progressPercent = ((currentStep) / STEPS.length) * 100

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Anchor className="w-6 h-6 text-cyan-600" />
            <span className="font-semibold text-slate-800 text-lg">DockSlot</span>
          </div>
          <span className="text-sm text-slate-500">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {/* Step labels - hidden on mobile */}
          <div className="hidden sm:flex justify-between py-2">
            {STEPS.map((step) => (
              <span
                key={step.id}
                className={`text-xs font-medium transition-colors ${
                  step.id === currentStep
                    ? 'text-cyan-600'
                    : step.id < currentStep
                    ? 'text-emerald-500'
                    : 'text-slate-400'
                }`}
              >
                {step.id < currentStep ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {step.shortTitle}
                  </span>
                ) : (
                  step.shortTitle
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-10">
            {/* ─── Step 0: Welcome & Profile ─── */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Anchor className="w-8 h-8 text-cyan-600" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    Welcome to DockSlot, Captain!
                  </h1>
                  <p className="text-slate-500 text-lg">
                    Let&apos;s get you set up in 5 minutes.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Captain Joe Smith"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Business Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Sailboat className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="Captain Joe's Charters"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Phone
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(555) 123-4567"
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Timezone
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent appearance-none"
                        >
                          {TIMEZONES.map(tz => (
                            <option key={tz.value} value={tz.value}>{tz.label}</option>
                          ))}
                        </select>
                        <ChevronRight className="absolute right-3 top-3 w-5 h-5 text-slate-400 rotate-90 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium">Email:</span>
                      <span>{userEmail}</span>
                      <span className="text-slate-400">(from your account)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 1: Meeting Spot ─── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    Where do your guests meet you?
                  </h2>
                  <p className="text-slate-500">
                    This powers weather monitoring for your trips.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Location Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g., Fells Point Marina"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={locationAddress}
                        onChange={(e) => {
                          setLocationAddress(e.target.value)
                          setGeoStatus('idle')
                          setGeoAddress(null)
                        }}
                        onBlur={() => geocodeAddress(locationAddress)}
                        placeholder="1732 Thames St, Baltimore, MD 21231"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Enter the full address and we&apos;ll confirm the location automatically.
                    </p>
                  </div>

                  {/* Geocode Status */}
                  {geoStatus === 'loading' && (
                    <div className="flex items-center gap-2 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                      <Loader2 className="w-4 h-4 text-cyan-600 animate-spin" />
                      <span className="text-sm text-cyan-700">Confirming location...</span>
                    </div>
                  )}
                  {geoStatus === 'success' && geoAddress && (
                    <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-emerald-700">
                          Location confirmed
                        </span>
                        <p className="text-sm text-emerald-600 mt-0.5">{geoAddress}</p>
                      </div>
                    </div>
                  )}
                  {geoStatus === 'error' && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <MapPin className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700">
                        Couldn&apos;t verify this address. You can still continue &mdash; update it later in Settings.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Step 2: Vessel ─── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    Tell us about your boat
                  </h2>
                  <p className="text-slate-500">
                    You can add more vessels later from the dashboard.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Vessel Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Ship className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={vesselName}
                        onChange={(e) => setVesselName(e.target.value)}
                        placeholder="e.g., Sea Breeze"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Passenger Capacity
                    </label>
                    <div className="flex items-center gap-6">
                      <button
                        type="button"
                        onClick={() => setPassengerCapacity(Math.max(1, passengerCapacity - 1))}
                        className="w-11 h-11 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors text-xl flex items-center justify-center"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <div className="text-4xl font-bold text-slate-900">{passengerCapacity}</div>
                        <div className="text-sm text-slate-500">passengers</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPassengerCapacity(Math.min(100, passengerCapacity + 1))}
                        className="w-11 h-11 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-bold transition-colors text-xl flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-slate-500 text-center bg-cyan-50 border border-cyan-100 rounded-lg p-2">
                      USCG 6-pack license allows up to 6 passengers.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Step 3: Trip Type ─── */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    What kind of trips do you offer?
                  </h2>
                  <p className="text-slate-500">
                    Start with one &mdash; you can add more later.
                  </p>
                </div>

                {/* Templates */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quick start from a template
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {TRIP_TEMPLATES.map((t, i) => (
                      <button
                        key={t.title}
                        type="button"
                        onClick={() => applyTemplate(i)}
                        className={`p-3 rounded-lg border-2 text-left transition-all ${
                          selectedTemplate === i
                            ? 'border-cyan-500 bg-cyan-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="font-medium text-slate-900 text-sm">{t.title}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          {t.duration}h &middot; ${t.price} &middot; ${t.deposit} deposit
                        </div>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(null)
                        setTripTitle('')
                        setDurationHours(4)
                        setTotalPrice(600)
                        setDepositAmount(150)
                      }}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedTemplate === null && tripTitle !== ''
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-dashed border-slate-300 bg-white hover:border-slate-400'
                      }`}
                    >
                      <div className="font-medium text-slate-700 text-sm">Custom</div>
                      <div className="text-xs text-slate-400 mt-1">Build your own</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Trip Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={tripTitle}
                      onChange={(e) => setTripTitle(e.target.value)}
                      placeholder="e.g., Half-Day Fishing Charter"
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Duration (hours)
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5"
                          value={durationHours}
                          onChange={(e) => setDurationHours(parseFloat(e.target.value) || 0)}
                          className="w-full pl-9 pr-2 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Total Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="25"
                        value={totalPrice}
                        onChange={(e) => setTotalPrice(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Deposit ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="25"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {totalPrice > 0 && (
                    <div className="p-3 bg-cyan-50 border border-cyan-100 rounded-lg">
                      <p className="text-sm text-cyan-700">
                        <strong>Preview:</strong> ${totalPrice} for a {durationHours}h trip
                        {depositAmount > 0 && ` (${depositAmount} deposit to book)`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── Step 4: Availability ─── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    When are you available?
                  </h2>
                  <p className="text-slate-500">
                    Toggle days on/off and set your hours. You can fine-tune this later.
                  </p>
                </div>

                <div className="space-y-2">
                  {availability.map((day) => (
                    <div
                      key={day.day_of_week}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        day.is_active
                          ? 'border-cyan-200 bg-cyan-50/50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleDay(day.day_of_week)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                          day.is_active ? 'bg-cyan-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                            day.is_active ? 'translate-x-[22px]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>

                      {/* Day name */}
                      <span className={`w-12 text-sm font-medium flex-shrink-0 ${
                        day.is_active ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {DAY_NAMES[day.day_of_week]}
                      </span>

                      {/* Mobile: full name hidden */}
                      <span className={`hidden sm:inline w-20 text-sm flex-shrink-0 ${
                        day.is_active ? 'text-slate-600' : 'text-slate-400'
                      }`}>
                        {DAY_FULL_NAMES[day.day_of_week]}
                      </span>

                      {/* Time inputs */}
                      {day.is_active ? (
                        <div className="flex items-center gap-2 ml-auto">
                          <input
                            type="time"
                            value={day.start_time}
                            onChange={(e) => updateDayTime(day.day_of_week, 'start_time', e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <span className="text-slate-400 text-sm">to</span>
                          <input
                            type="time"
                            value={day.end_time}
                            onChange={(e) => updateDayTime(day.day_of_week, 'end_time', e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>
                      ) : (
                        <span className="ml-auto text-sm text-slate-400 italic">Off</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Step 5: Share Your Link ─── */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
                    You&apos;re all set!
                  </h2>
                  <p className="text-slate-500 text-lg">
                    Here&apos;s your booking page. Share it with the world.
                  </p>
                </div>

                {/* Booking Link */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your booking link
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-700 font-mono">
                      {typeof window !== 'undefined'
                        ? `${window.location.origin}/book/${userId}`
                        : `/book/${userId}`}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        linkCopied
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-cyan-600 text-white hover:bg-cyan-500'
                      }`}
                    >
                      {linkCopied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-cyan-600 to-cyan-500 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Anchor className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {businessName || 'Your Business'}
                        </div>
                        <div className="text-cyan-100 text-sm">
                          Book your next trip
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4 bg-white">
                    <p className="text-sm text-slate-600 mb-3">
                      This is what guests see when they visit your booking page.
                    </p>
                    <a
                      href={`/book/${userId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-cyan-600 hover:text-cyan-500 font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Preview booking page
                    </a>
                  </div>
                </div>

                {/* Share suggestions */}
                <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4">
                  <p className="text-sm text-cyan-800 font-medium mb-1">
                    Share it everywhere
                  </p>
                  <p className="text-sm text-cyan-700">
                    Post this link on your website, social media, or send it directly to clients.
                  </p>
                </div>

                {/* Skipped steps warning */}
                {skippedSteps.size > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-amber-800 mb-1">
                      Complete your setup
                    </p>
                    <p className="text-sm text-amber-700">
                      You skipped {skippedSteps.size} step{skippedSteps.size > 1 ? 's' : ''}.
                      {' '}You can finish setting up from your dashboard.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ─── Error ─── */}
            {error && (
              <div className="mt-6 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}
          </div>

          {/* ─── Footer Navigation ─── */}
          <div className="border-t border-slate-200 px-6 sm:px-10 py-4 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSaving}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 disabled:opacity-50 flex items-center gap-1.5 text-sm font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Skip button - not on welcome or share step */}
              {currentStep > 0 && currentStep < 5 && (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSaving}
                  className="px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium disabled:opacity-50"
                >
                  Skip for now
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={isSaving}
                className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 font-semibold text-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : currentStep === 0 ? (
                  <>
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : currentStep === 5 ? (
                  <>
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
