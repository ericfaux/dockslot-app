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
} from 'lucide-react';
import { WaiverDocument } from '../../../components/WaiverDocument';
import { SignaturePad } from '../../../components/SignaturePad';
import {
  getWaiverForSigning,
  submitWaiverSignature,
  type WaiverForSigning,
} from '@/app/actions/waivers';

interface Props {
  params: Promise<{
    token: string;
    passengerId: string;
  }>;
}

export default function SignWaiverPage({ params }: Props) {
  const router = useRouter();
  const [token, setToken] = useState<string>('');
  const [passengerId, setPassengerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waiverData, setWaiverData] = useState<WaiverForSigning | null>(null);

  const [hasAgreed, setHasAgreed] = useState(false);
  const [hasReadDocument, setHasReadDocument] = useState(false);
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
    if (!waiverData || !signatureData || !hasAgreed) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitWaiverSignature({
      token,
      passengerId,
      waiverTemplateId: waiverData.template.id,
      signatureData,
      agreedToTerms: hasAgreed,
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

  const canSubmit = hasAgreed && signatureData && !isSubmitting;

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

  const { template, passenger } = waiverData;

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

        {/* Waiver Document */}
        <WaiverDocument
          title={template.title}
          content={template.content}
          version={template.version}
          onScrollToEnd={() => setHasReadDocument(true)}
        />

        {/* Agreement Section */}
        <div className="rounded-lg border border-slate-700 bg-slate-900 p-4 space-y-4">
          {/* Agreement Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center pt-0.5">
              <input
                type="checkbox"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-5 w-5 rounded border-2 border-slate-600 bg-slate-800 peer-checked:border-cyan-500 peer-checked:bg-cyan-500 transition-colors">
                {hasAgreed && (
                  <CheckCircle className="h-full w-full text-white p-0.5" />
                )}
              </div>
            </div>
            <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
              I, <strong className="text-white">{passenger.full_name}</strong>, have read and understand the above waiver.
              I voluntarily agree to its terms and conditions and acknowledge that this is a legally binding agreement.
            </span>
          </label>

          {/* Signature Pad */}
          <SignaturePad
            onSignatureChange={setSignatureData}
            disabled={!hasAgreed}
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

          {!hasAgreed && (
            <p className="text-xs text-slate-500 text-center">
              Please read and agree to the terms above before signing.
            </p>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-slate-500">
          By signing, you acknowledge that you have read, understood, and agree to the terms of this waiver.
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
