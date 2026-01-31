'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Anchor, Ship, Calendar, Check, ArrowRight, ArrowLeft, 
  Building2, MapPin, Phone, Mail, Loader2 
} from 'lucide-react'

interface OnboardingWizardProps {
  profile: any
}

const STEPS = [
  { id: 0, title: 'Welcome', icon: Anchor },
  { id: 1, title: 'Business Info', icon: Building2 },
  { id: 2, title: 'Your Fleet', icon: Ship },
  { id: 3, title: 'Trip Types', icon: Calendar },
  { id: 4, title: 'Complete', icon: Check },
]

export default function OnboardingWizard({ profile }: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(profile.onboarding_step || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState(profile.business_name || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [meetingLocation, setMeetingLocation] = useState(profile.meeting_location || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [email, setEmail] = useState(profile.email || '')

  // Step 2: Vessel
  const [vesselName, setVesselName] = useState('')
  const [vesselType, setVesselType] = useState('')
  const [maxPassengers, setMaxPassengers] = useState(6)
  const [vesselDescription, setVesselDescription] = useState('')

  // Step 3: Trip Type
  const [tripTitle, setTripTitle] = useState('')
  const [tripDescription, setTripDescription] = useState('')
  const [durationHours, setDurationHours] = useState(2)
  const [basePrice, setBasePrice] = useState(500)
  const [depositPercentage, setDepositPercentage] = useState(50)

  async function handleNext() {
    setError(null)
    setIsSaving(true)

    try {
      // Save current step data
      if (currentStep === 1) {
        await saveBusinessInfo()
      } else if (currentStep === 2) {
        await saveVessel()
      } else if (currentStep === 3) {
        await saveTripType()
      }

      // Move to next step
      const nextStep = currentStep + 1

      // Update onboarding progress
      await fetch(`/api/profiles/${profile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboarding_step: nextStep }),
      })

      setCurrentStep(nextStep)

      // If completed, mark as done and redirect
      if (nextStep >= 4) {
        await fetch(`/api/profiles/${profile.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
          }),
        })
        setTimeout(() => router.push('/dashboard'), 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveBusinessInfo() {
    if (!businessName.trim()) {
      throw new Error('Business name is required')
    }

    const res = await fetch(`/api/profiles/${profile.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: businessName,
        bio: bio || null,
        meeting_location: meetingLocation || null,
        phone: phone || null,
        email: email || null,
      }),
    })

    if (!res.ok) throw new Error('Failed to save business info')
  }

  async function saveVessel() {
    if (!vesselName.trim()) {
      throw new Error('Vessel name is required')
    }

    const res = await fetch('/api/vessels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        captain_id: profile.id,
        name: vesselName,
        vessel_type: vesselType || 'sailboat',
        max_passengers: maxPassengers,
        description: vesselDescription || null,
      }),
    })

    if (!res.ok) throw new Error('Failed to save vessel')
  }

  async function saveTripType() {
    if (!tripTitle.trim()) {
      throw new Error('Trip title is required')
    }

    // Get the vessel we just created
    const vesselsRes = await fetch(`/api/vessels?captain_id=${profile.id}`)
    const vesselsData = await vesselsRes.json()
    const vessel = vesselsData.vessels?.[0]

    if (!vessel) throw new Error('No vessel found')

    const res = await fetch('/api/trip-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        captain_id: profile.id,
        vessel_id: vessel.id,
        title: tripTitle,
        description: tripDescription || null,
        duration_hours: durationHours,
        base_price: basePrice * 100, // Convert to cents
        deposit_percentage: depositPercentage,
      }),
    })

    if (!res.ok) throw new Error('Failed to save trip type')
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? 'bg-cyan-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <StepIcon className="w-6 h-6" />
                      )}
                    </div>
                    <span
                      className={`mt-2 text-sm font-medium ${
                        isActive ? 'text-cyan-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`absolute top-6 left-[calc(50%+24px)] right-[calc(-50%+24px)] h-0.5 ${
                        isCompleted ? 'bg-emerald-600' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="text-center py-12">
              <Anchor className="w-20 h-20 text-cyan-400 mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white mb-4">
                Welcome to DockSlot! 🚢
              </h1>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Let's get your charter business set up in just a few minutes. 
                We'll help you create your profile, add your vessel, and create your first trip.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <Building2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">Business Info</h3>
                  <p className="text-sm text-slate-400">Your business details</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <Ship className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">Add Your Fleet</h3>
                  <p className="text-sm text-slate-400">Vessel information</p>
                </div>
                <div className="p-4 bg-slate-900/50 rounded-lg">
                  <Calendar className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-white mb-1">Create Trips</h3>
                  <p className="text-sm text-slate-400">Your trip offerings</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Business Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Tell Us About Your Business
                </h2>
                <p className="text-slate-400">
                  This information will be shown to guests when they book with you.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Business Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g., Captain Joe's Charters"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell guests about your experience and what makes your charters special..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Meeting Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={meetingLocation}
                      onChange={(e) => setMeetingLocation(e.target.value)}
                      placeholder="Marina name or address"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Vessel */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Add Your First Vessel
                </h2>
                <p className="text-slate-400">
                  Tell us about the boat you'll be using for charters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Vessel Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={vesselName}
                    onChange={(e) => setVesselName(e.target.value)}
                    placeholder="e.g., Sea Breeze"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Vessel Type
                  </label>
                  <select
                    value={vesselType}
                    onChange={(e) => setVesselType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  >
                    <option value="sailboat">Sailboat</option>
                    <option value="motorboat">Motorboat</option>
                    <option value="yacht">Yacht</option>
                    <option value="catamaran">Catamaran</option>
                    <option value="pontoon">Pontoon</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Maximum Passengers
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setMaxPassengers(Math.max(1, maxPassengers - 1))}
                    className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-colors"
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-3xl font-bold text-white">{maxPassengers}</div>
                    <div className="text-sm text-slate-400">passengers</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaxPassengers(Math.min(100, maxPassengers + 1))}
                    className="w-12 h-12 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={vesselDescription}
                  onChange={(e) => setVesselDescription(e.target.value)}
                  placeholder="Describe your vessel's features, amenities, and condition..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Trip Type */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Create Your First Trip Type
                </h2>
                <p className="text-slate-400">
                  Define the type of charter you'll offer.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Trip Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={tripTitle}
                  onChange={(e) => setTripTitle(e.target.value)}
                  placeholder="e.g., Sunset Cruise"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={tripDescription}
                  onChange={(e) => setTripDescription(e.target.value)}
                  placeholder="What will guests experience on this trip?"
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={durationHours}
                    onChange={(e) => setDurationHours(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Base Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Deposit (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    value={depositPercentage}
                    onChange={(e) => setDepositPercentage(parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>
              </div>

              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <p className="text-sm text-cyan-300">
                  <strong>Preview:</strong> ${basePrice} for a {durationHours}h trip 
                  (${(basePrice * depositPercentage / 100).toFixed(0)} deposit required)
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 4 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-12 h-12 text-emerald-400" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                You're All Set! 🎉
              </h2>
              <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                Your charter business is ready to accept bookings. 
                Redirecting you to your dashboard...
              </p>
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading dashboard...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && currentStep < 4 && (
            <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStep === 0 || isSaving}
                className="px-6 py-3 text-slate-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={isSaving}
                className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : currentStep === 0 ? (
                  <>
                    Get Started
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : currentStep === 3 ? (
                  <>
                    Complete Setup
                    <Check className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
