import type { Metadata } from "next";
import Link from "next/link";
import { Anchor } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — DockSlot",
  description:
    "DockSlot Terms of Service. Read about the terms governing the use of our charter fishing booking platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600">
              <Anchor className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              DockSlot
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login?mode=signin"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline-block"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=register"
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="bg-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Last updated: February 8, 2026
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="prose-slate space-y-10 text-base leading-relaxed text-slate-600">
          {/* 1. Acceptance */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Acceptance of Terms
            </h2>
            <p className="mt-3">
              By accessing or using the DockSlot platform (&quot;Service&quot;),
              operated by DockSlot (&quot;Company,&quot; &quot;we,&quot;
              &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these
              Terms of Service (&quot;Terms&quot;). If you do not agree to these
              Terms, do not use the Service.
            </p>
            <p className="mt-3">
              We may update these Terms from time to time. Continued use of the
              Service after changes constitutes acceptance of the revised Terms.
              We will notify registered users of material changes via email.
            </p>
          </section>

          {/* 2. Service Description */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. Service Description
            </h2>
            <p className="mt-3">
              DockSlot is a software-as-a-service (SaaS) booking and management
              platform designed for charter fishing captains. The Service
              provides:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Shareable booking links for guests to schedule charter trips
              </li>
              <li>
                Calendar and schedule management for trip availability
              </li>
              <li>
                Automated booking confirmations, reminders, and notifications
              </li>
              <li>
                NOAA weather data integration for weather-aware scheduling
              </li>
              <li>
                Payment processing through Stripe for deposits and trip fees
              </li>
              <li>Guest management including contact information and history</li>
              <li>Digital waivers and manifest tracking</li>
            </ul>
            <p className="mt-3">
              DockSlot is a tool for managing bookings. We are not a party to the
              charter agreement between captains and their guests, and we do not
              guarantee the availability, quality, or safety of any charter trip.
            </p>
          </section>

          {/* 3. User Accounts */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. User Accounts
            </h2>
            <p className="mt-3">
              To use the Service as a captain, you must create an account by
              providing accurate and complete information. You are responsible
              for:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Maintaining the confidentiality of your login credentials
              </li>
              <li>All activity that occurs under your account</li>
              <li>
                Ensuring your account information remains current and accurate
              </li>
              <li>
                Notifying us immediately of any unauthorized use of your account
              </li>
            </ul>
            <p className="mt-3">
              You must be at least 18 years of age and hold any licenses or
              permits required to operate a charter fishing business in your
              jurisdiction.
            </p>
          </section>

          {/* 4. Acceptable Use */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Acceptable Use
            </h2>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable regulations
              </li>
              <li>
                Submit false, misleading, or fraudulent booking information
              </li>
              <li>
                Interfere with or disrupt the Service or its infrastructure
              </li>
              <li>
                Attempt to access other users&apos; accounts or data without
                authorization
              </li>
              <li>
                Scrape, harvest, or collect data from the Service through
                automated means without prior written consent
              </li>
              <li>
                Use the Service to send unsolicited communications (spam) to
                guests
              </li>
              <li>
                Resell or redistribute access to the Service without
                authorization
              </li>
            </ul>
          </section>

          {/* 5. Booking & Guest Data */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Booking &amp; Guest Data
            </h2>
            <p className="mt-3">
              As a captain using DockSlot, you collect guest information
              (including names, email addresses, phone numbers, and party sizes)
              through the Service. You acknowledge that:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                You are the data controller for guest information collected
                through your booking page
              </li>
              <li>
                You are responsible for complying with applicable privacy laws
                regarding your guests&apos; personal data
              </li>
              <li>
                You will only use guest data for purposes related to the charter
                trip and your business relationship with the guest
              </li>
              <li>
                DockSlot processes guest data on your behalf as a data processor,
                as described in our{" "}
                <Link
                  href="/privacy"
                  className="text-cyan-600 underline hover:text-cyan-700"
                >
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </section>

          {/* 6. Payment Terms */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Payment Terms
            </h2>
            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Subscription Fees
            </h3>
            <p className="mt-2">
              DockSlot offers a free Starter tier and paid subscription plans.
              Paid plans are billed monthly. All fees are stated in U.S. dollars
              and are non-refundable except as required by law or as expressly
              stated in these Terms.
            </p>
            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Guest Payment Processing
            </h3>
            <p className="mt-2">
              Guest payments (deposits, trip fees) are processed through Stripe.
              By using our payment features, you agree to{" "}
              <a
                href="https://stripe.com/legal"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 underline hover:text-cyan-700"
              >
                Stripe&apos;s Terms of Service
              </a>
              . DockSlot is not responsible for Stripe&apos;s processing of
              payments, chargebacks, or disputes.
            </p>
            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Captain Payouts
            </h3>
            <p className="mt-2">
              Funds collected from guests are transferred to your connected
              Stripe account according to Stripe&apos;s standard payout
              schedule. DockSlot does not hold or control guest funds.
            </p>
          </section>

          {/* 7. Cancellations & Refunds */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              7. Cancellations &amp; Refunds
            </h2>
            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Subscription Cancellation
            </h3>
            <p className="mt-2">
              You may cancel your paid subscription at any time from your account
              settings. Cancellation takes effect at the end of the current
              billing period. No partial refunds are provided for unused time
              within a billing cycle.
            </p>
            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Trip Cancellations
            </h3>
            <p className="mt-2">
              Captains set their own cancellation and refund policies for charter
              trips. DockSlot provides tools to manage cancellations but does not
              enforce or adjudicate refund disputes between captains and guests.
            </p>
            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Weather-Based Cancellations
            </h3>
            <p className="mt-2">
              DockSlot integrates NOAA weather data to help captains make
              informed decisions about weather-related cancellations. Weather
              holds and cancellations are ultimately at the captain&apos;s
              discretion. DockSlot does not guarantee the accuracy of weather
              data and is not liable for decisions made based on weather
              information displayed in the Service.
            </p>
          </section>

          {/* 8. Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              8. Intellectual Property
            </h2>
            <p className="mt-3">
              The Service, including its design, code, features, and
              documentation, is owned by DockSlot and protected by intellectual
              property laws. Your use of the Service does not grant you ownership
              of any intellectual property rights in the Service.
            </p>
            <p className="mt-3">
              You retain ownership of the content you provide through the Service
              (business information, photos, trip descriptions). You grant
              DockSlot a limited license to use this content solely to operate
              and improve the Service.
            </p>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              9. Limitation of Liability
            </h2>
            <p className="mt-3">
              To the maximum extent permitted by applicable law:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                The Service is provided &quot;as is&quot; and &quot;as
                available&quot; without warranties of any kind, express or
                implied
              </li>
              <li>
                DockSlot does not warrant that the Service will be
                uninterrupted, error-free, or free of harmful components
              </li>
              <li>
                DockSlot is not liable for any indirect, incidental, special,
                consequential, or punitive damages arising from your use of the
                Service
              </li>
              <li>
                DockSlot&apos;s total aggregate liability shall not exceed the
                amount you paid for the Service in the twelve (12) months
                preceding the claim
              </li>
              <li>
                DockSlot is not responsible for the conduct of any captain,
                guest, or third party, including the safety of any charter trip
              </li>
            </ul>
          </section>

          {/* 10. Indemnification */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              10. Indemnification
            </h2>
            <p className="mt-3">
              You agree to indemnify, defend, and hold harmless DockSlot and its
              officers, directors, employees, and agents from any claims,
              damages, losses, or expenses (including reasonable attorney&apos;s
              fees) arising from:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your charter operations and guest interactions</li>
              <li>
                Any dispute between you and your guests regarding bookings,
                payments, or charter services
              </li>
            </ul>
          </section>

          {/* 11. Termination */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              11. Termination
            </h2>
            <p className="mt-3">
              We may suspend or terminate your account if you violate these Terms
              or for any other reason at our sole discretion, with or without
              notice. Upon termination:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Your right to access the Service ceases immediately</li>
              <li>
                We may delete your account data after a reasonable retention
                period (typically 30 days)
              </li>
              <li>
                You may request an export of your data prior to deletion by
                contacting us
              </li>
              <li>
                Provisions that by their nature should survive termination
                (including limitation of liability, indemnification, and
                governing law) shall survive
              </li>
            </ul>
          </section>

          {/* 12. Governing Law */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              12. Governing Law &amp; Disputes
            </h2>
            <p className="mt-3">
              These Terms are governed by and construed in accordance with the
              laws of the State of Florida, without regard to conflict of law
              principles. Any disputes arising from these Terms or the Service
              shall be resolved through binding arbitration in accordance with
              the American Arbitration Association&apos;s rules, conducted in the
              State of Florida.
            </p>
            <p className="mt-3">
              You agree to resolve disputes on an individual basis and waive any
              right to participate in a class action lawsuit or class-wide
              arbitration.
            </p>
          </section>

          {/* 13. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              13. Contact Information
            </h2>
            <p className="mt-3">
              If you have questions about these Terms, please contact us at:
            </p>
            <p className="mt-3 font-medium text-slate-900">
              DockSlot
              <br />
              Email:{" "}
              <a
                href="mailto:support@dockslot.com"
                className="text-cyan-600 underline hover:text-cyan-700"
              >
                support@dockslot.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600">
                <Anchor className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                DockSlot
              </span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <Link
                href="/login?mode=signin"
                className="transition-colors hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/login?mode=register"
                className="transition-colors hover:text-slate-900"
              >
                Sign up
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-slate-900"
              >
                Terms
              </Link>
              <Link
                href="/privacy"
                className="transition-colors hover:text-slate-900"
              >
                Privacy
              </Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-slate-100 pt-8 text-center text-sm text-slate-400">
            &copy; {new Date().getFullYear()} DockSlot. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
