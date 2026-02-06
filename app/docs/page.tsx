"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Anchor,
  CalendarCheck,
  Users,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  UserCircle,
  Ship,
  Clock,
  Share2,
  Eye,
  CheckCircle,
  XCircle,
  CloudRain,
  DollarSign,
  Globe,
  MapPin,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface HelpSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  topics: HelpTopic[];
}

const sections: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Set up your DockSlot account and start accepting bookings.",
    icon: <Anchor size={20} />,
    topics: [
      {
        id: "profile",
        title: "Setting up your profile",
        icon: <UserCircle size={16} />,
        content:
          "Head to Settings > Profile to add your captain name, business name, location, and a short bio. Upload a photo so guests know who they're booking with. Your profile info appears on your public booking page.",
      },
      {
        id: "trip-types",
        title: "Adding trip types",
        icon: <Anchor size={16} />,
        content:
          "Go to Settings > Trip Types to create the trips you offer — inshore, offshore, sunset cruises, etc. Set the duration, max passengers, pricing, and a description for each. You can enable or disable trip types at any time without deleting them.",
      },
      {
        id: "vessels",
        title: "Configuring vessels",
        icon: <Ship size={16} />,
        content:
          "Under Settings > Vessels, add the boats you run charters on. Include the vessel name, capacity, and any relevant details. If you run multiple boats, guests will see vessel info when they book so they know what to expect.",
      },
      {
        id: "availability",
        title: "Setting your availability",
        icon: <Clock size={16} />,
        content:
          "Use Settings > Availability to define which days and time slots you're open for bookings. You can set recurring weekly schedules, block off specific dates, and adjust seasonal hours. Your booking page will only show open slots to guests.",
      },
      {
        id: "booking-link",
        title: "Sharing your booking link",
        icon: <Share2 size={16} />,
        content:
          "Your unique booking link is shown on the Dashboard and in Settings > Booking Page. Share it on social media, your website, Google Business profile, or text it directly to potential guests. Anyone with the link can view your available trips and book online.",
      },
    ],
  },
  {
    id: "managing-bookings",
    title: "Managing Bookings",
    description: "Handle reservations, cancellations, and payments.",
    icon: <CalendarCheck size={20} />,
    topics: [
      {
        id: "viewing-bookings",
        title: "Viewing your bookings",
        icon: <Eye size={16} />,
        content:
          "The Bookings page shows all reservations in a searchable, filterable list. Use the Schedule view for a calendar layout. Each booking shows the guest name, trip type, date, party size, status, and payment info at a glance.",
      },
      {
        id: "confirming-cancelling",
        title: "Confirming and cancelling bookings",
        icon: <CheckCircle size={16} />,
        content:
          "New bookings arrive as pending. Open a booking to confirm it — the guest will receive an automatic confirmation email and text. To cancel, use the cancel action on the booking detail. The guest is notified and any applicable refund policy from your cancellation settings is applied.",
      },
      {
        id: "weather-holds",
        title: "Weather holds",
        icon: <CloudRain size={16} />,
        content:
          "DockSlot monitors NOAA weather data for your area. When conditions look rough, you can place a booking on weather hold. The guest is notified that the trip is weather-dependent and you can reschedule or cancel closer to the date. Weather alerts also appear on your Dashboard.",
      },
      {
        id: "deposits",
        title: "Deposits and payments",
        icon: <DollarSign size={16} />,
        content:
          "Configure deposit requirements in Settings > Payments. You can require a flat fee or percentage at the time of booking. Deposits are collected through Stripe. The Payments page gives you a full ledger of transactions, refunds, and payouts.",
      },
    ],
  },
  {
    id: "guest-experience",
    title: "Guest Experience",
    description: "What your guests see when they book a trip.",
    icon: <Users size={20} />,
    topics: [
      {
        id: "booking-flow",
        title: "The booking flow",
        icon: <Globe size={16} />,
        content:
          "When a guest opens your booking link, they see your profile, available trip types, and open dates. They pick a trip, choose a date and time slot, enter their party size and contact info, and complete the deposit if required. The whole flow takes about two minutes.",
      },
      {
        id: "guest-confirmations",
        title: "Confirmations and reminders",
        icon: <CheckCircle size={16} />,
        content:
          "After booking, guests get an email and optional SMS confirmation with the trip details, location, and what to bring. DockSlot sends automatic reminders before the trip so guests don't forget. You can customize reminder timing in Settings > Notifications.",
      },
      {
        id: "guest-waivers",
        title: "Digital waivers",
        icon: <MapPin size={16} />,
        content:
          "If you've set up waivers under Settings > Waivers, guests are prompted to sign digitally before the trip. You can require waivers at booking time or send them separately. Signed waivers are stored on the booking record for your records.",
      },
      {
        id: "guest-manage",
        title: "Managing their booking",
        icon: <Users size={16} />,
        content:
          "Guests receive a link to manage their booking where they can view trip details, request a reschedule, or cancel according to your cancellation policy. This reduces back-and-forth texts and calls for routine changes.",
      },
    ],
  },
];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    id: "faq-free",
    question: "Is DockSlot free to use?",
    answer:
      "DockSlot offers a free tier for captains getting started. As your booking volume grows, paid plans unlock additional features like SMS notifications, advanced analytics, and priority support.",
  },
  {
    id: "faq-stripe",
    question: "How do payments work?",
    answer:
      "DockSlot integrates with Stripe for secure payment processing. You connect your Stripe account in Settings > Payments, set your deposit amount, and deposits are collected automatically when guests book. Funds are transferred to your bank account on Stripe's normal payout schedule.",
  },
  {
    id: "faq-calendar",
    question: "Can I sync with my personal calendar?",
    answer:
      "Yes. DockSlot provides a calendar export (ICS feed) that syncs with Google Calendar, Apple Calendar, and Outlook. Any booking changes are reflected automatically. Set this up on the Schedule page via the calendar sync option.",
  },
  {
    id: "faq-multiple-boats",
    question: "Can I manage multiple vessels?",
    answer:
      "Yes. Add as many vessels as you need under Settings > Vessels. Each vessel can have its own capacity and details. When guests book, they'll see which vessel is assigned to their trip.",
  },
  {
    id: "faq-weather",
    question: "How does weather monitoring work?",
    answer:
      "DockSlot pulls data from NOAA for your configured location. When wind, wave, or storm conditions exceed thresholds, you'll see alerts on your Dashboard and can place affected bookings on weather hold. Guests are kept in the loop automatically.",
  },
  {
    id: "faq-offline",
    question: "What is Dock Mode?",
    answer:
      "Dock Mode is a simplified, high-contrast view designed for use on the water or at the dock. It shows only today's trips with large touch targets — perfect for checking in guests from your phone on a sunny day. Enable it in Settings > Advanced.",
  },
  {
    id: "faq-guests-cancel",
    question: "What happens when a guest cancels?",
    answer:
      "Guest cancellations follow the cancellation policy you've configured in Settings > Cancellation Policy. You define the refund windows — for example, full refund 7+ days out, 50% refund within 3-7 days, no refund within 3 days. Guests see the policy when they book.",
  },
  {
    id: "faq-waitlist",
    question: "How does the waitlist work?",
    answer:
      "When a date or trip is fully booked, guests can join the waitlist. If a spot opens up due to a cancellation, you can offer it to waitlisted guests directly from the Waitlist page. They receive a notification with a limited-time link to claim the slot.",
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between w-full px-5 py-4 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <span>{item.question}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`flex-shrink-0 ml-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
          {item.answer}
        </div>
      )}
    </div>
  );
}

function TopicCard({ topic }: { topic: HelpTopic }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-lg hover:border-cyan-200 transition-colors">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center justify-between w-full px-4 py-3.5 text-left text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
        aria-expanded={expanded}
      >
        <span className="flex items-center gap-2.5">
          <span className="text-cyan-600 flex-shrink-0">{topic.icon}</span>
          {topic.title}
        </span>
        <ChevronRight
          size={14}
          aria-hidden="true"
          className={`flex-shrink-0 ml-3 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
        />
      </button>
      {expanded && (
        <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 ml-[30px]">
          {topic.content}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DocsPage() {
  const [query, setQuery] = useState("");

  const lowerQuery = query.toLowerCase().trim();

  // Filter sections and topics based on search query
  const filteredSections = useMemo(() => {
    if (!lowerQuery) return sections;

    return sections
      .map((section) => ({
        ...section,
        topics: section.topics.filter(
          (t) =>
            t.title.toLowerCase().includes(lowerQuery) ||
            t.content.toLowerCase().includes(lowerQuery)
        ),
      }))
      .filter(
        (section) =>
          section.topics.length > 0 ||
          section.title.toLowerCase().includes(lowerQuery) ||
          section.description.toLowerCase().includes(lowerQuery)
      );
  }, [lowerQuery]);

  const filteredFAQ = useMemo(() => {
    if (!lowerQuery) return faqItems;
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(lowerQuery) ||
        item.answer.toLowerCase().includes(lowerQuery)
    );
  }, [lowerQuery]);

  const hasResults = filteredSections.length > 0 || filteredFAQ.length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center gap-4 h-16 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 rounded-md px-1"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <span className="text-lg font-semibold tracking-tight text-slate-900">
            Help Center
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero / Search */}
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            How can we help?
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mb-6">
            Search the docs or browse topics below.
          </p>

          {/* Search bar */}
          <div className="relative max-w-lg mx-auto">
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help topics..."
              className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-shadow"
            />
          </div>
        </div>

        {!hasResults && (
          <div className="text-center py-16">
            <HelpCircle
              size={40}
              className="mx-auto text-slate-300 mb-3"
              aria-hidden="true"
            />
            <p className="text-slate-500 text-sm">
              No results for &ldquo;{query}&rdquo;. Try a different search term.
            </p>
          </div>
        )}

        {/* Sections */}
        <div className="space-y-10">
          {filteredSections.map((section) => (
            <section key={section.id} id={section.id}>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-cyan-600">{section.icon}</span>
                <h2 className="text-lg font-semibold text-slate-900">
                  {section.title}
                </h2>
              </div>
              <p className="text-sm text-slate-500 mb-4 ml-[30px]">
                {section.description}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 ml-0 sm:ml-[30px]">
                {section.topics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            </section>
          ))}

          {/* FAQ */}
          {filteredFAQ.length > 0 && (
            <section id="faq">
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-cyan-600">
                  <HelpCircle size={20} />
                </span>
                <h2 className="text-lg font-semibold text-slate-900">
                  Frequently Asked Questions
                </h2>
              </div>
              <p className="text-sm text-slate-500 mb-4 ml-[30px]">
                Quick answers to common questions.
              </p>
              <div className="space-y-2 ml-0 sm:ml-[30px]">
                {filteredFAQ.map((item) => (
                  <FAQAccordion key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Footer help */}
        <div className="mt-16 mb-8 text-center border-t border-slate-200 pt-8">
          <p className="text-sm text-slate-500">
            Can&apos;t find what you&apos;re looking for?
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Reach out at{" "}
            <a
              href="mailto:support@dockslot.app"
              className="text-cyan-600 hover:text-cyan-700 underline underline-offset-2"
            >
              support@dockslot.app
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
