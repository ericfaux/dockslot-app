import Link from "next/link";
import {
  Calendar,
  CloudSun,
  FileCheck,
  Anchor,
  ChevronRight,
  Waves,
  Clock,
  Shield,
  Smartphone,
  Check,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-600">
              <Anchor className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              DockSlot
            </span>
          </div>
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-sm font-medium text-cyan-700">
                <Anchor className="h-3.5 w-3.5" />
                Built for 6-pack charter captains
              </div>
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                The Booking System Built for Charter Captains
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
                Stop juggling texts, phone calls, and spreadsheets. DockSlot
                gives you a shareable booking link, automated confirmations, and
                weather monitoring — so you can focus on putting fish in the
                boat.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/login?mode=register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700"
                >
                  Start Free
                  <ChevronRight className="h-4 w-4" />
                </Link>
                <span className="text-sm text-slate-500">
                  No credit card required
                </span>
              </div>
            </div>

            {/* Hero Illustration — CSS-based dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto w-full max-w-sm">
                {/* Phone frame */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 shadow-2xl shadow-slate-200/50">
                  <div className="overflow-hidden rounded-2xl bg-white">
                    {/* Status bar mockup */}
                    <div className="flex items-center justify-between bg-slate-900 px-4 py-2 text-xs text-white">
                      <span>9:41</span>
                      <div className="flex gap-1">
                        <div className="h-2.5 w-2.5 rounded-full bg-white/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
                        <div className="h-2.5 w-2.5 rounded-full bg-white/80" />
                      </div>
                    </div>
                    {/* App header */}
                    <div className="bg-slate-900 px-4 pb-4 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-cyan-500" />
                        <span className="text-sm font-semibold text-white">
                          DockSlot
                        </span>
                      </div>
                      <p className="mt-3 text-lg font-bold text-white">
                        Today&apos;s Trips
                      </p>
                      <p className="text-xs text-slate-400">
                        3 bookings confirmed
                      </p>
                    </div>
                    {/* Trip cards */}
                    <div className="space-y-3 p-4">
                      <TripCard
                        time="6:00 AM"
                        name="Johnson Party"
                        guests={4}
                        status="confirmed"
                      />
                      <TripCard
                        time="11:30 AM"
                        name="Miller Family"
                        guests={6}
                        status="confirmed"
                      />
                      <TripCard
                        time="4:00 PM"
                        name="Davis Group"
                        guests={3}
                        status="weather_hold"
                      />
                    </div>
                    {/* Bottom nav mockup */}
                    <div className="flex border-t border-slate-100 px-2 py-3">
                      <div className="flex flex-1 flex-col items-center gap-1">
                        <div className="h-4 w-4 rounded bg-cyan-500/20" />
                        <div className="h-1.5 w-6 rounded-full bg-cyan-500" />
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-1">
                        <div className="h-4 w-4 rounded bg-slate-200" />
                        <div className="h-1.5 w-6 rounded-full bg-slate-200" />
                      </div>
                      <div className="flex flex-1 flex-col items-center gap-1">
                        <div className="h-4 w-4 rounded bg-slate-200" />
                        <div className="h-1.5 w-6 rounded-full bg-slate-200" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating notification card */}
                <div className="absolute -left-8 top-1/3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50">
                      <Check className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        New Booking
                      </p>
                      <p className="text-xs text-slate-500">
                        Party of 4 — Saturday
                      </p>
                    </div>
                  </div>
                </div>
                {/* Weather alert card */}
                <div className="absolute -right-4 bottom-1/4 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50">
                      <CloudSun className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">
                        Weather Clear
                      </p>
                      <p className="text-xs text-slate-500">
                        Winds 8mph SE
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Subtle wave decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
      </section>

      {/* Problem / Solution Section */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Juggling texts, calls, and spreadsheets to manage your charter
              bookings?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              You didn&apos;t get your captain&apos;s license to spend half your
              day on the phone managing bookings. DockSlot handles the logistics
              so you can do what you do best.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <SolutionCard
              icon={<Clock className="h-6 w-6" />}
              title="Shareable Booking Link"
              description="Send one link. Guests pick their date, time, and party size. No back-and-forth."
            />
            <SolutionCard
              icon={<Shield className="h-6 w-6" />}
              title="Automated Confirmations"
              description="Booking confirmations, reminders, and updates go out automatically."
            />
            <SolutionCard
              icon={<CloudSun className="h-6 w-6" />}
              title="Weather Monitoring"
              description="NOAA data checks every trip. You and your guests get alerts if conditions change."
            />
            <SolutionCard
              icon={<FileCheck className="h-6 w-6" />}
              title="Waiver Management"
              description="Guests sign digital waivers before they show up. No clipboard at the dock."
            />
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything a charter captain needs
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Purpose-built tools for running a charter operation, not a
              generic booking widget.
            </p>
          </div>

          <div className="space-y-16 lg:space-y-24">
            <FeatureRow
              icon={<Calendar className="h-8 w-8 text-cyan-600" />}
              title="24/7 Online Booking"
              description="Your booking page is always open. Guests find an available slot, enter their info, and book — even at 2 AM. You wake up to a full manifest."
              badge="Bookings while you sleep"
              reverse={false}
            />
            <FeatureRow
              icon={<CloudSun className="h-8 w-8 text-cyan-600" />}
              title="NOAA Weather Alerts"
              description="DockSlot monitors NOAA weather data for every scheduled trip. If conditions go south, you and your guests get notified automatically. No more manually checking forecasts for each trip."
              badge="Automatic monitoring"
              reverse={true}
            />
            <FeatureRow
              icon={<FileCheck className="h-8 w-8 text-cyan-600" />}
              title="Digital Waivers"
              description="Guests sign liability waivers online before they arrive. Everything is stored and organized — no more chasing signatures at the dock or losing paper forms."
              badge="Signed before arrival"
              reverse={false}
            />
            <FeatureRow
              icon={<Smartphone className="h-8 w-8 text-cyan-600" />}
              title="Dock Mode"
              description="A simplified, glanceable view designed for when you're on the water. See who's coming, check-in guests, and manage your day from your phone — even with wet hands."
              badge="Built for the water"
              reverse={true}
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700">
              <Anchor className="h-4 w-4" />
              Built specifically for 6-pack charter captains
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Join the first captains on DockSlot
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              We&apos;re building DockSlot alongside working charter captains.
              Early access members help shape the product and lock in the best
              deal.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <TestimonialPlaceholder
              quote="DockSlot gets it. It's built for how charter captains actually work, not some generic booking system."
              name="Early Access Captain"
              detail="Gulf Coast, FL"
            />
            <TestimonialPlaceholder
              quote="I used to spend an hour every night confirming trips and checking weather. Now it just happens."
              name="Early Access Captain"
              detail="Outer Banks, NC"
            />
            <TestimonialPlaceholder
              quote="My guests love the booking link. They pick a date, sign the waiver, and show up ready to fish."
              name="Early Access Captain"
              detail="San Diego, CA"
            />
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-center">
            <Stat value="100%" label="Free during early access" />
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <Stat value="< 5 min" label="Setup time" />
            <div className="hidden h-8 w-px bg-slate-200 sm:block" />
            <Stat value="6-pack" label="Built for small operators" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Free during early access. We&apos;ll always have a free tier for
              small operators.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 lg:grid-cols-2">
            {/* Free Tier */}
            <div className="rounded-2xl border-2 border-cyan-600 bg-white p-8 shadow-sm">
              <div className="mb-1 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                EARLY ACCESS
              </div>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                Starter
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight text-slate-900">
                  $0
                </span>
                <span className="text-lg text-slate-500">/month</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Everything you need to start taking bookings online. Free
                forever for small operators.
              </p>
              <Link
                href="/login?mode=register"
                className="mt-6 block rounded-lg bg-cyan-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
              >
                Get Started Free
              </Link>
              <ul className="mt-6 space-y-3">
                <PricingFeature text="Online booking page" />
                <PricingFeature text="Up to 30 bookings/month" />
                <PricingFeature text="Automated confirmations" />
                <PricingFeature text="NOAA weather alerts" />
                <PricingFeature text="Digital waivers" />
                <PricingFeature text="Dock Mode" />
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-1 inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                MOST POPULAR
              </div>
              <h3 className="mt-3 text-2xl font-bold text-slate-900">
                Captain Pro
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-bold tracking-tight text-slate-900">
                  $29
                </span>
                <span className="text-lg text-slate-500">/month</span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                For busy captains who need advanced tools and unlimited
                bookings.
              </p>
              <Link
                href="/login?mode=register&plan=pro"
                className="mt-6 block rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Start with Pro
              </Link>
              <ul className="mt-6 space-y-3">
                <PricingFeature text="Everything in Starter" />
                <PricingFeature text="Unlimited bookings" />
                <PricingFeature text="Deposit collection via Stripe" />
                <PricingFeature text="SMS reminders" />
                <PricingFeature text="Custom branding" />
                <PricingFeature text="Priority support" />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <Waves className="mx-auto mb-6 h-10 w-10 text-cyan-400" />
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to stop chasing bookings?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
            Set up your DockSlot booking page in under 5 minutes. Your guests
            will thank you.
          </p>
          <Link
            href="/login?mode=register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-cyan-400"
          >
            Start Free Today
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600">
                <Anchor className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">
                DockSlot
              </span>
            </div>
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

/* ─── Sub-components ───────────────────────────────────────────────── */

function TripCard({
  time,
  name,
  guests,
  status,
}: {
  time: string;
  name: string;
  guests: number;
  status: "confirmed" | "weather_hold";
}) {
  const isHold = status === "weather_hold";
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
      <div className="text-xs font-semibold text-slate-500">{time}</div>
      <div className="flex-1">
        <p className="text-sm font-medium text-slate-900">{name}</p>
        <p className="text-xs text-slate-400">
          {guests} guest{guests !== 1 ? "s" : ""}
        </p>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
          isHold
            ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700"
        }`}
      >
        {isHold ? "Weather Hold" : "Confirmed"}
      </span>
    </div>
  );
}

function SolutionCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
    </div>
  );
}

function FeatureRow({
  icon,
  title,
  description,
  badge,
  reverse,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge: string;
  reverse: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-8 lg:flex-row lg:gap-16 ${
        reverse ? "lg:flex-row-reverse" : ""
      }`}
    >
      {/* Illustration placeholder */}
      <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="flex h-48 w-full max-w-md items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-cyan-50 sm:h-64">
          <div className="flex flex-col items-center gap-3">
            {icon}
            <span className="text-sm font-medium text-cyan-600">{badge}</span>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2">
        <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
        <p className="mt-3 text-base leading-relaxed text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

function TestimonialPlaceholder({
  quote,
  name,
  detail,
}: {
  quote: string;
  name: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <p className="text-sm leading-relaxed text-slate-600">
        &ldquo;{quote}&rdquo;
      </p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
          <Anchor className="h-4 w-4 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function PricingFeature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
      <span className="text-sm text-slate-600">{text}</span>
    </li>
  );
}
