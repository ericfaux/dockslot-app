'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Anchor,
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  User,
  FileSignature,
  Shield,
  ScrollText,
} from 'lucide-react';
import { WaiverDocument } from '../../../components/WaiverDocument';
import { SignaturePad } from '../../../components/SignaturePad';
import {
  getWaiverForSigning,
  submitWaiverSignature,
  type WaiverForSigning,
} from '@/app/actions/waivers';
import type { WaiverVariableContext } from '@/lib/utils/waiver-variables';

interface Props {
  params: Promise<{
    token: string;
    passengerId: string;
  }>;
}

// Collect device info for audit trail
function getDeviceInfo() {
  if (typeof window === 'undefined') return null;

  return {
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export default function SignWaiverPage({ params }: Props) {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [passengerId, setPassengerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waiverData, setWaiverData] = useState<WaiverForSigning | null>(null);

  // Multi-step agreement states
  const [hasReadDocument, setHasReadDocument] = useState(false);
  const [hasConfirmedRead, setHasConfirmedRead] = useState(false);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const [hasConsentedToEsign, setHasConsentedToEsign] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [remainingWaivers, setRemainingWaivers] = useState(0);

  // Resolve params
  useEffect(() => {
    params.then((p) => {
      setToken(p.token);
      setPassengerId(p.passengerId);
    });
  }, [params]);

  // Load waiver data
  useEffect(() => {
    if (!token || !passengerId) return;

    async function loadWaiverData() {
      setIsLoading(true);
      setError(null);

      const result = await getWaiverForSigning(token, passengerId);

      if (!result.success) {
        // If all waivers signed, redirect back to main page
        if (result.code === 'ALREADY_SIGNED') {
          router.push(`/waivers/${token}`);
          return;
        }
        setError(result.error || 'Failed to load waiver');
        setIsLoading(false);
        return;
      }

      setWaiverData(result.data!);
      setIsLoading(false);
    }

    loadWaiverData();
  }, [token, passengerId, router]);

  const handleSubmit = async () => {
    if (!waiverData || !signatureData || !hasAgreedToTerms || !hasConsentedToEsign) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const deviceInfo = getDeviceInfo();

    const result = await submitWaiverSignature({
      token,
      passengerId,
      waiverTemplateId: waiverData.template.id,
      signatureData,
      agreedToTerms: hasAgreedToTerms,
      deviceInfo,
    });

    if (!result.success) {
      setSubmitError(result.error || 'Failed to submit signature');
      setIsSubmitting(false);
      return;
    }

    setRemainingWaivers(result.data!.remainingWaivers);
    setIsSuccess(true);
    setIsSubmitting(false);
  };

  const handleContinue = () => {
    if (remainingWaivers > 0) {
      // Reload page to get next waiver
      window.location.reload();
    } else {
      // Go back to main waivers page
      router.push(`/waivers/${token}`);
    }
  };

  // Can only sign after completing all steps
  const canSign = hasConfirmedRead && hasAgreedToTerms && hasConsentedToEsign;
  const canSubmit = canSign && signatureData && !isSubmitting;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
                <AlertTriangle className="h-8 w-8 text-rose-400" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">Error</h1>
            <p className="text-slate-400 mb-4">{error}</p>
            <Link
              href={`/waivers/${token}`}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to waivers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!waiverData) {
    return null;
  }

  const { template, passenger, booking } = waiverData;

  // Build variable context for substitution
  const variableContext: WaiverVariableContext = {
    guestName: booking.guest_name,
    passengerName: passenger.full_name,
    tripDate: booking.scheduled_start,
    vesselName: booking.vessel?.name,
    tripType: booking.trip_type?.title,
    partySize: booking.party_size,
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0a1628]">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                <Anchor className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Waiver Signed</h1>
                <p className="text-sm text-slate-400">{passenger.full_name}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-10 w-10 text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Waiver Signed Successfully!</h2>
            <p className="text-slate-400 mb-6">
              {passenger.full_name} has signed the {template.title}.
            </p>

            {remainingWaivers > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-amber-400">
                  {remainingWaivers} more waiver{remainingWaivers !== 1 ? 's' : ''} to sign for this passenger.
                </p>
                <button
                  onClick={handleContinue}
                  className="w-full px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-colors"
                >
                  Continue to Next Waiver
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-emerald-400">
                  All waivers complete for {passenger.full_name}!
                </p>
                <button
                  onClick={handleContinue}
                  className="w-full px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-medium transition-colors"
                >
                  Back to Waiver Overview
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628]">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/waivers/${token}`}
                className="p-2 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10">
                  <FileSignature className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">Sign Waiver</h1>
                  <p className="text-sm text-slate-400">{template.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Passenger Info */}
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Signing as</p>
              <p className="font-medium text-white">{passenger.full_name}</p>
            </div>
          </div>
        </div>

        {/* Step 1: Read the Waiver Document */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasReadDocument ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              1
            </div>
            <h2 className="text-sm font-medium text-slate-300">Read the Waiver Document</h2>
            {hasReadDocument && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          </div>
          <WaiverDocument
            title={template.title}
            content={template.content}
            version={template.version}
            onScrollToEnd={() => setHasReadDocument(true)}
            variableContext={variableContext}
          />
        </div>

        {/* Step 2: Confirm Reading */}
        <div className={`space-y-3 transition-opacity ${hasReadDocument ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasConfirmedRead ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              2
            </div>
            <h2 className="text-sm font-medium text-slate-300">Confirm You&apos;ve Read the Document</h2>
            {hasConfirmedRead && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center pt-0.5">
                <input
                  type="checkbox"
                  checked={hasConfirmedRead}
                  onChange={(e) => setHasConfirmedRead(e.target.checked)}
                  disabled={!hasReadDocument}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded border-2 border-slate-600 bg-slate-800 peer-checked:border-cyan-500 peer-checked:bg-cyan-500 peer-disabled:opacity-50 transition-colors">
                  {hasConfirmedRead && (
                    <ScrollText className="h-full w-full text-white p-0.5" />
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                I have scrolled through and <strong className="text-white">read the entire waiver document</strong> above.
              </span>
            </label>
          </div>
        </div>

        {/* Step 3: Agree to Terms */}
        <div className={`space-y-3 transition-opacity ${hasConfirmedRead ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasAgreedToTerms ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              3
            </div>
            <h2 className="text-sm font-medium text-slate-300">Agree to Terms</h2>
            {hasAgreedToTerms && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center pt-0.5">
                <input
                  type="checkbox"
                  checked={hasAgreedToTerms}
                  onChange={(e) => setHasAgreedToTerms(e.target.checked)}
                  disabled={!hasConfirmedRead}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded border-2 border-slate-600 bg-slate-800 peer-checked:border-cyan-500 peer-checked:bg-cyan-500 peer-disabled:opacity-50 transition-colors">
                  {hasAgreedToTerms && (
                    <CheckCircle className="h-full w-full text-white p-0.5" />
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                I, <strong className="text-white">{passenger.full_name}</strong>, have read and understand the above waiver.
                I voluntarily agree to its terms and conditions and acknowledge that this is a <strong className="text-white">legally binding agreement</strong>.
              </span>
            </label>
          </div>
        </div>

        {/* Step 4: E-Signature Consent */}
        <div className={`space-y-3 transition-opacity ${hasAgreedToTerms ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasConsentedToEsign ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              4
            </div>
            <h2 className="text-sm font-medium text-slate-300">Electronic Signature Consent</h2>
            {hasConsentedToEsign && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
              <Shield className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-400 space-y-2">
                <p>
                  <strong className="text-slate-300">Electronic Signature Disclosure:</strong> By checking the box below and providing your electronic signature,
                  you consent to sign this document electronically. Your electronic signature has the same legal effect as a handwritten signature.
                </p>
                <p>
                  Your signature, along with your name, the date and time of signing, your IP address, and device information will be recorded
                  to create a legally defensible signature record.
                </p>
              </div>
            </div>
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center pt-0.5">
                <input
                  type="checkbox"
                  checked={hasConsentedToEsign}
                  onChange={(e) => setHasConsentedToEsign(e.target.checked)}
                  disabled={!hasAgreedToTerms}
                  className="peer sr-only"
                />
                <div className="h-5 w-5 rounded border-2 border-slate-600 bg-slate-800 peer-checked:border-cyan-500 peer-checked:bg-cyan-500 peer-disabled:opacity-50 transition-colors">
                  {hasConsentedToEsign && (
                    <CheckCircle className="h-full w-full text-white p-0.5" />
                  )}
                </div>
              </div>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                I consent to use an <strong className="text-white">electronic signature</strong> and understand that my signature below
                will be legally binding.
              </span>
            </label>
          </div>
        </div>

        {/* Step 5: Sign */}
        <div className={`space-y-3 transition-opacity ${canSign ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${signatureData ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
              5
            </div>
            <h2 className="text-sm font-medium text-slate-300">Sign the Waiver</h2>
            {signatureData && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-4">
            <SignaturePad
              onSignatureChange={setSignatureData}
              disabled={!canSign}
              label="Sign here with your finger or mouse"
            />

            {/* Submit Error */}
            {submitError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30">
                <p className="text-sm text-rose-400">{submitError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileSignature className="h-5 w-5" />
                  Submit Signature
                </>
              )}
            </button>

            {!canSign && (
              <p className="text-xs text-slate-500 text-center">
                Please complete all steps above before signing.
              </p>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-slate-500">
          By signing, you acknowledge that you have read, understood, and agree to the terms of this waiver.
          A copy of the signed waiver will be available for your records.
        </p>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <p className="text-center text-sm text-slate-500">
            Powered by DockSlot
          </p>
        </div>
      </footer>
    </div>
  );
}
