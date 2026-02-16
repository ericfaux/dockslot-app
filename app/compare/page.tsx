import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Anchor,
  Check,
  X,
  CloudRain,
  Clock,
  DollarSign,
  Users,
  FileText,
  Shield,
  Zap,
  ArrowRight,
  Quote,
  Calculator,
  Star,
  Ship,
  ChevronRight,
} from 'lucide-react'
import { PricingCalculator } from './PricingCalculator'

export const metadata: Metadata = {
  title: 'Why DockSlot? | Charter Boat Booking Software for 6-Pack Captains',
  description:
    'Compare DockSlot to Checkfront, FareHarbor, and other booking systems. Built specifically for charter boat captains with weather rescheduling, waiver management, and no marketplace fees.',
  keywords: [
    'charter boat booking software',
    '6-pack captain booking system',
    'fishing charter software',
    'charter boat scheduling',
    'FareHarbor alternative',
    'Checkfront alternative',
    'charter boat management',
  ],
  openGraph: {
    title: 'Why DockSlot? | Built for 6-Pack Captains',
    description:
      'The booking system that actually fits how charter captains work. No complexity, no unused features, no marketplace fees.',
    type: 'website',
  },
}

const comparisonFeatures = [
  {
    feature: 'Weather reschedule workflow',
    dockslot: { value: true, note: 'Built-in' },
    checkfront: { value: false, note: 'Manual' },
    fareharbor: { value: false, note: 'Manual' },
  },
  {
    feature: '6-passenger cap enforced',
    dockslot: { value: true, note: null },
    checkfront: { value: false, note: 'Generic' },
    fareharbor: { value: false, note: 'Generic' },
  },
  {
    feature: 'Waivers tied to booking',
    dockslot: { value: true, note: null },
    checkfront: { value: 'partial', note: 'Separate' },
    fareharbor: { value: 'partial', note: 'Separate' },
  },
  {
    feature: 'Setup time',
    dockslot: { value: true, note: '<10 min' },
    checkfront: { value: false, note: 'Hours' },
    fareharbor: { value: false, note: 'Hours' },
  },
  {
    feature: 'Marketplace commission',
    dockslot: { value: true, note: '0%' },
    checkfront: { value: true, note: '0%' },
    fareharbor: { value: false, note: '6%+' },
  },
  {
    feature: 'Monthly cost',
    dockslot: { value: true, note: '$29' },
    checkfront: { value: false, note: '$79+' },
    fareharbor: { value: 'partial', note: '"Free" + fees' },
  },
  {
    feature: 'Guest communication tools',
    dockslot: { value: true, note: 'Built-in' },
    checkfront: { value: true, note: 'Add-on' },
    fareharbor: { value: true, note: 'Basic' },
  },
  {
    feature: 'Mobile-friendly booking',
    dockslot: { value: true, note: null },
    checkfront: { value: true, note: null },
    fareharbor: { value: true, note: null },
  },
]

const painPoints = [
  {
    icon: Zap,
    title: 'Overwhelming complexity',
    description:
      'Enterprise software with hundreds of features you\'ll never use. Just finding the calendar takes 10 clicks.',
  },
  {
    icon: DollarSign,
    title: 'Hidden fees everywhere',
    description:
      'Free to sign up, then 6% of every booking. That $400 trip just cost you $24 in fees.',
  },
  {
    icon: CloudRain,
    title: 'No weather workflow',
    description:
      'When weather hits, you\'re stuck manually emailing guests, tracking who rebooked, and hoping nothing falls through the cracks.',
  },
  {
    icon: Users,
    title: 'Built for tour companies',
    description:
      'Inventory management, multi-staff permissions, OTA channels — features designed for buses and theme parks, not fishing charters.',
  },
]

const whatWeDontHave = [
  { text: 'No SKUs, categories, or inventory management', reason: 'You have one boat.' },
  { text: 'No multi-staff permissions and roles', reason: 'It\'s you, the captain.' },
  { text: 'No OTA integrations or channel managers', reason: 'You don\'t need middlemen.' },
  { text: 'No enterprise reporting dashboards', reason: 'You need bookings, not board meetings.' },
  { text: 'No gift certificate systems', reason: 'Keep it simple.' },
]

const testimonials = [
  {
    quote:
      'I spent three hours trying to set up Checkfront. With DockSlot, I was taking bookings in 15 minutes.',
    author: 'Captain Mike',
    location: 'Destin, FL',
    rating: 5,
  },
  {
    quote:
      'The weather reschedule feature alone is worth it. Last month I had to move 8 trips — took me 10 minutes total.',
    author: 'Captain Sarah',
    location: 'Key West, FL',
    rating: 5,
  },
  {
    quote:
      'FareHarbor was taking $200+ per month in commissions. Now I keep that money.',
    author: 'Captain James',
    location: 'Galveston, TX',
    rating: 5,
  },
]

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/95 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Anchor className="h-8 w-8 text-cyan-400" />
            <span className="text-xl font-bold text-white">DockSlot</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-2 font-semibold text-white transition-all hover:from-cyan-500 hover:to-blue-500"
          >
            Start Free Trial
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Built for 6-Pack Captains.
              <br />
              <span className="text-cyan-400">Not Tour Companies.</span>
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-300">
              DockSlot is the booking system that actually fits how you work.
              No complexity. No unused features. No marketplace fees.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-500 hover:to-blue-500"
              >
                Start Your Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="text-sm text-slate-400">No credit card required</span>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section className="border-b border-slate-800 bg-slate-900/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Other tools weren&apos;t built for you
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              The average captain uses <span className="font-semibold text-cyan-400">5%</span> of
              Checkfront&apos;s features. You&apos;re paying for software designed for theme parks and bus tours.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-rose-600/5 p-6"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20">
                  <point.icon className="h-6 w-6 text-rose-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">{point.title}</h3>
                <p className="text-sm text-slate-400">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              See how we compare
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              Built from the ground up for charter captains, not retrofitted from enterprise software.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-4 text-left text-sm font-medium text-slate-400">
                    Feature
                  </th>
                  <th className="w-1/4 rounded-t-lg bg-gradient-to-b from-cyan-500/20 to-transparent px-4 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Anchor className="h-6 w-6 text-cyan-400" />
                      <span className="font-bold text-cyan-400">DockSlot</span>
                    </div>
                  </th>
                  <th className="w-1/4 px-4 py-4 text-center text-sm font-medium text-slate-400">
                    Checkfront
                  </th>
                  <th className="w-1/4 px-4 py-4 text-center text-sm font-medium text-slate-400">
                    FareHarbor
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, index) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-slate-800 ${
                      index % 2 === 0 ? 'bg-slate-900/30' : ''
                    }`}
                  >
                    <td className="px-4 py-4 text-sm font-medium text-white">{row.feature}</td>
                    <td className="bg-cyan-500/5 px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {row.dockslot.value === true && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                            <Check className="h-4 w-4 text-emerald-400" />
                          </span>
                        )}
                        {row.dockslot.note && (
                          <span className="text-xs font-medium text-cyan-400">
                            {row.dockslot.note}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {row.checkfront.value === true && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                            <Check className="h-4 w-4 text-emerald-400" />
                          </span>
                        )}
                        {row.checkfront.value === false && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20">
                            <X className="h-4 w-4 text-rose-400" />
                          </span>
                        )}
                        {row.checkfront.value === 'partial' && (
                          <span className="text-xs text-amber-400">~</span>
                        )}
                        {row.checkfront.note && (
                          <span className="text-xs text-slate-500">{row.checkfront.note}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {row.fareharbor.value === true && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                            <Check className="h-4 w-4 text-emerald-400" />
                          </span>
                        )}
                        {row.fareharbor.value === false && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20">
                            <X className="h-4 w-4 text-rose-400" />
                          </span>
                        )}
                        {row.fareharbor.value === 'partial' && (
                          <span className="text-xs text-amber-400">~</span>
                        )}
                        {row.fareharbor.note && (
                          <span className="text-xs text-slate-500">{row.fareharbor.note}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* What We Don't Have Section */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              What we <span className="text-cyan-400">don&apos;t</span> have
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              Because you don&apos;t need them. And you shouldn&apos;t pay for them.
            </p>
          </div>

          <div className="mx-auto max-w-3xl space-y-4">
            {whatWeDontHave.map((item) => (
              <div
                key={item.text}
                className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-800/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700">
                    <X className="h-4 w-4 text-slate-400" />
                  </span>
                  <span className="text-slate-300">{item.text}</span>
                </div>
                <span className="hidden text-sm text-slate-500 sm:block">{item.reason}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Weather Workflow Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <CloudRain className="h-8 w-8 text-cyan-400" />
                <span className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                  Weather Workflow
                </span>
              </div>
              <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
                Weather happens.
                <br />
                We handle it.
              </h2>
              <p className="mb-8 text-lg text-slate-400">
                When conditions aren&apos;t safe, you shouldn&apos;t be stuck manually emailing every guest,
                tracking who responded, and hoping you don&apos;t double-book. DockSlot handles it all.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400">
                    1
                  </span>
                  <span className="text-slate-300">
                    Mark trip as weather-affected with one click
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400">
                    2
                  </span>
                  <span className="text-slate-300">
                    Guests automatically receive reschedule options
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400">
                    3
                  </span>
                  <span className="text-slate-300">
                    They pick a new time from your available slots
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-sm font-bold text-cyan-400">
                    4
                  </span>
                  <span className="text-slate-300">Done. Calendar updated, everyone notified.</span>
                </li>
              </ul>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
                {/* Weather workflow visual */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <CloudRain className="h-8 w-8 text-amber-400" />
                    <div>
                      <p className="font-semibold text-white">Storm Advisory</p>
                      <p className="text-sm text-slate-400">4 trips affected tomorrow</p>
                    </div>
                    <button className="ml-auto rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-400">
                      Reschedule All
                    </button>
                  </div>

                  <div className="flex items-center justify-center py-2">
                    <ChevronRight className="h-6 w-6 rotate-90 text-slate-600" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                        <Check className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Johnson Party</p>
                        <p className="text-xs text-slate-500">Rebooked to Saturday 7AM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/50 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                        <Check className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Smith Family</p>
                        <p className="text-xs text-slate-500">Rebooked to Sunday 6AM</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20">
                        <Clock className="h-4 w-4 text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">Miller Group</p>
                        <p className="text-xs text-slate-500">Selecting new time...</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-cyan-500/10 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-32 w-32 rounded-full bg-blue-500/10 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Transparency Section */}
      <section className="border-y border-slate-800 bg-slate-900/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 flex items-center justify-center gap-2">
              <DollarSign className="h-8 w-8 text-cyan-400" />
              <span className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                Pricing
              </span>
            </div>
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Simple pricing. No surprises.
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              One flat monthly fee. No commissions, no booking fees, no hidden costs.
            </p>
          </div>

          <div className="mb-16 grid gap-6 lg:grid-cols-3">
            {/* DockSlot */}
            <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-8">
              <div className="absolute right-4 top-4 rounded-full bg-cyan-500 px-3 py-1 text-xs font-bold text-slate-900">
                BEST VALUE
              </div>
              <div className="mb-2 flex items-center gap-2">
                <Anchor className="h-6 w-6 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">DockSlot</h3>
              </div>
              <div className="mb-1">
                <span className="text-sm text-slate-400">Free &mdash; </span>
                <span className="text-4xl font-bold text-white">$29</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                Captain plan. Free Deckhand tier also available. Fleet from $79/mo.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Unlimited bookings
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  0% commission, always
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Weather rescheduling
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Waiver management
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  Stripe payment processing
                </li>
              </ul>
              <p className="text-center text-sm text-cyan-400">
                At 50 bookings/month = <strong>$0.58</strong> per booking
              </p>
            </div>

            {/* Checkfront */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
              <h3 className="mb-2 text-xl font-bold text-white">Checkfront</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">$79</span>
                <span className="text-slate-400">-$299/mo</span>
              </div>
              <ul className="mb-6 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-slate-500" />
                  Based on booking volume
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-slate-500" />
                  Add-ons cost extra
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-400" />
                  No weather workflow
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-400" />
                  Complex setup
                </li>
              </ul>
              <p className="text-center text-sm text-slate-500">
                Designed for tour operators
              </p>
            </div>

            {/* FareHarbor */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
              <h3 className="mb-2 text-xl font-bold text-white">FareHarbor</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">&ldquo;Free&rdquo;</span>
              </div>
              <ul className="mb-6 space-y-2 text-sm text-slate-400">
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-400" />
                  6%+ per booking
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-400" />
                  Fees add up fast
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-400" />
                  No weather workflow
                </li>
                <li className="flex items-center gap-2">
                  <X className="h-4 w-4 text-rose-400" />
                  Marketplace pressure
                </li>
              </ul>
              <p className="text-center text-sm text-rose-400">
                At 50 bookings × $400 = <strong>$1,200+</strong>/month in fees
              </p>
            </div>
          </div>

          {/* Calculator */}
          <PricingCalculator />
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Captains are switching to DockSlot
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-400">
              Join charter captains across the Gulf Coast who&apos;ve simplified their booking process.
            </p>
          </div>

          {/* Stats */}
          <div className="mb-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
              <div className="mb-2 text-4xl font-bold text-cyan-400">150+</div>
              <div className="text-sm text-slate-400">Captains using DockSlot</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
              <div className="mb-2 text-4xl font-bold text-cyan-400">10,000+</div>
              <div className="text-sm text-slate-400">Bookings processed</div>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
              <div className="mb-2 text-4xl font-bold text-cyan-400">$0</div>
              <div className="text-sm text-slate-400">Booking fees charged</div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.author}
                className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6"
              >
                <Quote className="mb-4 h-8 w-8 text-amber-400/50" />
                <div className="mb-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= testimonial.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="mb-4 text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
                    <Ship className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-slate-500">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-slate-800 bg-gradient-to-r from-cyan-900/20 to-blue-900/20 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Ready to simplify your bookings?
          </h2>
          <p className="mb-8 text-xl text-slate-300">
            Join 150+ captains who&apos;ve switched to DockSlot.
            <br />
            Start your free trial today — no credit card required.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all hover:from-cyan-500 hover:to-blue-500"
            >
              Start Your Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:hello@dockslot.com?subject=Talk to a captain who switched"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-8 py-4 text-lg font-semibold text-white transition-all hover:border-slate-500 hover:bg-slate-700"
            >
              Talk to a Captain Who Switched
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Setup takes less than 10 minutes. Really.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Anchor className="h-6 w-6 text-cyan-400" />
              <span className="font-bold text-white">DockSlot</span>
            </div>
            <p className="text-sm text-slate-500">
              Built for 6-pack captains, by people who understand the water.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
