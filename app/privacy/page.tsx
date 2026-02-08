import type { Metadata } from "next";
import Link from "next/link";
import { Anchor } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — DockSlot",
  description:
    "DockSlot Privacy Policy. Learn how we collect, use, and protect your data on our charter fishing booking platform.",
};

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Last updated: February 8, 2026
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="prose-slate space-y-10 text-base leading-relaxed text-slate-600">
          {/* Introduction */}
          <section>
            <p>
              DockSlot (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or
              &quot;our&quot;) operates a booking and management platform for
              charter fishing captains. This Privacy Policy explains how we
              collect, use, disclose, and protect information when you use our
              website and services (collectively, the &quot;Service&quot;).
            </p>
            <p className="mt-3">
              By using the Service, you consent to the practices described in
              this Privacy Policy. If you do not agree, please discontinue use of
              the Service.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              1. Information We Collect
            </h2>

            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Captain Account Information
            </h3>
            <p className="mt-2">
              When you create a captain account, we collect:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Name, email address, and password (via Supabase Authentication)
              </li>
              <li>
                Business details: business name, phone number, marina/dock
                location
              </li>
              <li>Trip types, pricing, and availability schedules</li>
              <li>
                Stripe account information for payment processing (managed by
                Stripe)
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Guest Booking Information
            </h3>
            <p className="mt-2">
              When guests book trips through a captain&apos;s booking page, we
              collect:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>Guest name and email address</li>
              <li>Phone number</li>
              <li>Party size and trip preferences</li>
              <li>
                Payment information (credit card details are processed directly
                by Stripe and are never stored on our servers)
              </li>
              <li>Booking notes and special requests</li>
            </ul>

            <h3 className="mt-4 text-lg font-medium text-slate-800">
              Automatically Collected Information
            </h3>
            <p className="mt-2">
              When you use the Service, we automatically collect:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Device information (browser type, operating system, device type)
              </li>
              <li>IP address and approximate location</li>
              <li>Pages visited, features used, and interaction patterns</li>
              <li>
                Performance and analytics data (via Vercel Analytics and Speed
                Insights)
              </li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              2. How We Use Your Information
            </h2>
            <p className="mt-3">We use collected information to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Operate and maintain the Service</li>
              <li>
                Process bookings, send confirmations, reminders, and
                notifications
              </li>
              <li>Process payments through Stripe</li>
              <li>
                Provide NOAA weather data relevant to scheduled trips and charter
                locations
              </li>
              <li>Send transactional emails (booking updates, account alerts)</li>
              <li>
                Improve the Service through usage analytics and performance
                monitoring
              </li>
              <li>
                Respond to support requests and communicate with you about your
                account
              </li>
              <li>
                Comply with legal obligations and enforce our Terms of Service
              </li>
            </ul>
          </section>

          {/* 3. Third-Party Services */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              3. Third-Party Services
            </h2>
            <p className="mt-3">
              We rely on trusted third-party services to operate the platform.
              Each service has its own privacy practices:
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900">
                  Supabase — Database &amp; Authentication
                </h4>
                <p className="mt-1 text-sm">
                  Stores account data, booking records, guest information, and
                  business settings. Handles user authentication and session
                  management. See{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 underline hover:text-cyan-700"
                  >
                    Supabase Privacy Policy
                  </a>
                  .
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900">
                  Stripe — Payment Processing
                </h4>
                <p className="mt-1 text-sm">
                  Processes guest payments and captain payouts. Credit card
                  numbers are sent directly to Stripe and never touch our
                  servers. See{" "}
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 underline hover:text-cyan-700"
                  >
                    Stripe Privacy Policy
                  </a>
                  .
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900">
                  Resend — Transactional Email
                </h4>
                <p className="mt-1 text-sm">
                  Sends booking confirmations, reminders, cancellation notices,
                  and account-related emails. Receives recipient email addresses
                  and message content. See{" "}
                  <a
                    href="https://resend.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 underline hover:text-cyan-700"
                  >
                    Resend Privacy Policy
                  </a>
                  .
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900">
                  NOAA — Weather Data
                </h4>
                <p className="mt-1 text-sm">
                  We fetch weather forecast data from the National Oceanic and
                  Atmospheric Administration (NOAA) API based on marina/dock
                  locations to display forecasts and power weather-hold features.
                  No personal data is shared with NOAA.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="font-medium text-slate-900">
                  Vercel — Hosting &amp; Analytics
                </h4>
                <p className="mt-1 text-sm">
                  Hosts the application and provides web analytics and
                  performance monitoring. Collects anonymized usage data,
                  including page views and performance metrics. See{" "}
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 underline hover:text-cyan-700"
                  >
                    Vercel Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>

          {/* 4. Cookies */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              4. Cookies &amp; Tracking Technologies
            </h2>
            <p className="mt-3">We use cookies and similar technologies to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <span className="font-medium text-slate-800">
                  Essential cookies:
                </span>{" "}
                Maintain your authentication session and remember login state
                (required for the Service to function)
              </li>
              <li>
                <span className="font-medium text-slate-800">
                  Analytics cookies:
                </span>{" "}
                Collect anonymized usage data through Vercel Analytics to help us
                understand how the Service is used and improve performance
              </li>
            </ul>
            <p className="mt-3">
              We do not use advertising cookies or sell data to advertisers. You
              can configure your browser to block cookies, but this may prevent
              the Service from functioning correctly.
            </p>
          </section>

          {/* 5. Data Storage & Security */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              5. Data Storage &amp; Security
            </h2>
            <p className="mt-3">
              Your data is stored in Supabase-managed PostgreSQL databases with
              encryption at rest and in transit. We implement industry-standard
              security measures including:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>HTTPS/TLS encryption for all data in transit</li>
              <li>Encryption at rest for stored data</li>
              <li>Row-level security policies in our database</li>
              <li>
                Secure authentication with hashed passwords (managed by
                Supabase)
              </li>
              <li>
                PCI DSS compliance for payment data (handled entirely by Stripe)
              </li>
            </ul>
            <p className="mt-3">
              While we take reasonable precautions to protect your data, no
              method of electronic storage or transmission is 100% secure. We
              cannot guarantee absolute security.
            </p>
          </section>

          {/* 6. Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              6. Data Sharing &amp; Disclosure
            </h2>
            <p className="mt-3">
              We do not sell your personal information. We share data only in the
              following circumstances:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <span className="font-medium text-slate-800">
                  Between captains and guests:
                </span>{" "}
                Guest booking information is shared with the captain whose trip
                was booked, and captain contact/business details are shared with
                guests who book trips
              </li>
              <li>
                <span className="font-medium text-slate-800">
                  With service providers:
                </span>{" "}
                As described in the Third-Party Services section above, solely to
                operate the Service
              </li>
              <li>
                <span className="font-medium text-slate-800">
                  Legal requirements:
                </span>{" "}
                When required by law, subpoena, court order, or governmental
                regulation
              </li>
              <li>
                <span className="font-medium text-slate-800">
                  Business transfers:
                </span>{" "}
                In connection with a merger, acquisition, or sale of assets, your
                data may be transferred to the acquiring entity
              </li>
            </ul>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              7. Data Retention
            </h2>
            <p className="mt-3">
              We retain your data for as long as your account is active or as
              needed to provide the Service. Specifically:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <span className="font-medium text-slate-800">
                  Account data:
                </span>{" "}
                Retained while your account is active and for 30 days after
                deletion request
              </li>
              <li>
                <span className="font-medium text-slate-800">
                  Booking records:
                </span>{" "}
                Retained for the duration of the captain&apos;s account, as they
                may be needed for business and tax records
              </li>
              <li>
                <span className="font-medium text-slate-800">
                  Payment records:
                </span>{" "}
                Retained as required by financial regulations (typically 7 years)
              </li>
              <li>
                <span className="font-medium text-slate-800">
                  Analytics data:
                </span>{" "}
                Retained in anonymized form indefinitely
              </li>
            </ul>
          </section>

          {/* 8. Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              8. Your Rights
            </h2>
            <p className="mt-3">
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>

            <h3 className="mt-4 text-lg font-medium text-slate-800">
              All Users
            </h3>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                <span className="font-medium text-slate-800">Access:</span>{" "}
                Request a copy of the personal data we hold about you
              </li>
              <li>
                <span className="font-medium text-slate-800">Correction:</span>{" "}
                Request correction of inaccurate personal data
              </li>
              <li>
                <span className="font-medium text-slate-800">Deletion:</span>{" "}
                Request deletion of your account and associated data
              </li>
              <li>
                <span className="font-medium text-slate-800">Export:</span>{" "}
                Request a machine-readable export of your data
              </li>
            </ul>

            <h3 className="mt-4 text-lg font-medium text-slate-800">
              GDPR Rights (EEA Residents)
            </h3>
            <p className="mt-2">
              If you are located in the European Economic Area, you have
              additional rights under the General Data Protection Regulation:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Right to restrict processing of your personal data
              </li>
              <li>Right to data portability</li>
              <li>
                Right to object to processing based on legitimate interests
              </li>
              <li>Right to withdraw consent at any time</li>
              <li>
                Right to lodge a complaint with your local data protection
                authority
              </li>
            </ul>
            <p className="mt-2">
              Our legal bases for processing include: performance of a contract
              (providing the Service), legitimate interests (improving the
              Service, preventing fraud), and consent (where applicable).
            </p>

            <h3 className="mt-4 text-lg font-medium text-slate-800">
              CCPA Rights (California Residents)
            </h3>
            <p className="mt-2">
              Under the California Consumer Privacy Act, California residents
              have the right to:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Know what personal information we collect, use, and disclose
              </li>
              <li>Request deletion of personal information</li>
              <li>Opt out of the sale of personal information (we do not sell personal information)</li>
              <li>
                Non-discrimination for exercising your privacy rights
              </li>
            </ul>

            <p className="mt-4">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:privacy@dockslot.com"
                className="text-cyan-600 underline hover:text-cyan-700"
              >
                privacy@dockslot.com
              </a>
              . We will respond to verified requests within 30 days.
            </p>
          </section>

          {/* 9. Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              9. Children&apos;s Privacy
            </h2>
            <p className="mt-3">
              The Service is not directed to individuals under 18. We do not
              knowingly collect personal information from children. If we become
              aware that we have collected data from a child under 18 without
              parental consent, we will delete that information promptly.
            </p>
          </section>

          {/* 10. International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              10. International Data Transfers
            </h2>
            <p className="mt-3">
              Your data may be processed and stored in the United States and
              other countries where our service providers operate. If you are
              located outside the United States, your data will be transferred to
              and processed in the U.S. We rely on standard contractual clauses
              and other lawful transfer mechanisms to ensure adequate protection
              for international data transfers.
            </p>
          </section>

          {/* 11. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              11. Changes to This Policy
            </h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. We will notify
              registered users of material changes via email and update the
              &quot;Last updated&quot; date at the top of this page. Continued
              use of the Service after changes constitutes acceptance of the
              revised policy.
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="text-xl font-semibold text-slate-900">
              12. Contact Information
            </h2>
            <p className="mt-3">
              For privacy-related questions, data requests, or concerns, contact
              us at:
            </p>
            <p className="mt-3 font-medium text-slate-900">
              DockSlot — Privacy
              <br />
              Email:{" "}
              <a
                href="mailto:privacy@dockslot.com"
                className="text-cyan-600 underline hover:text-cyan-700"
              >
                privacy@dockslot.com
              </a>
            </p>
            <p className="mt-3">
              For general support inquiries, contact{" "}
              <a
                href="mailto:support@dockslot.com"
                className="text-cyan-600 underline hover:text-cyan-700"
              >
                support@dockslot.com
              </a>
              .
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
