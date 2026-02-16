'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  MapPin,
  Anchor,
  Ship,
  Clock,
  FileSignature,
  CreditCard,
  Link2,
  Bell,
  Wrench,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Profile, AvailabilityWindow, TripType, Vessel, SubscriptionTier } from '@/lib/db/types';
import { ProfileTab } from '../tabs/ProfileTab';
import { MeetingSpotTab } from '../tabs/MeetingSpotTab';
import { TripTypesTab } from '../tabs/TripTypesTab';
import { VesselsTab } from '../tabs/VesselsTab';
import { AvailabilityTab } from '../tabs/AvailabilityTab';
import { WaiversTab } from '../tabs/WaiversTab';
import { PaymentsTab } from '../tabs/PaymentsTab';
import { BookingPageTab } from '../tabs/BookingPageTab';
import { AdvancedTab } from '../tabs/AdvancedTab';
import { NotificationsTab } from '../tabs/NotificationsTab';

export interface WaiverTemplate {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsTabsProps {
  profile: Profile | null;
  availabilityWindows: AvailabilityWindow[];
  userEmail: string;
  calendarToken: string;
  tripTypes: TripType[];
  vessels: Vessel[];
  waiverTemplates: WaiverTemplate[];
  stripeAccountId: string | null;
  stripeOnboardingComplete: boolean;
}

interface TabDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
}

const TABS: TabDefinition[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'meeting-spot', label: 'Meeting Spot', icon: MapPin },
  { id: 'trip-types', label: 'Trip Types', icon: Anchor },
  { id: 'vessels', label: 'Vessels', icon: Ship },
  { id: 'availability', label: 'Availability', icon: Clock },
  { id: 'waivers', label: 'Waivers', icon: FileSignature },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'booking-page', label: 'Booking Page', icon: Link2 },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
];

export function SettingsTabs(props: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const tabBarRef = useRef<HTMLDivElement>(null);

  const setActiveTab = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', tabId);
      router.push(`/dashboard/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Scroll the active tab button into view when the active tab changes
  useEffect(() => {
    const container = tabBarRef.current;
    if (!container) return;
    const activeButton = container.querySelector<HTMLElement>(
      `[data-tab="${activeTab}"]`
    );
    if (activeButton) {
      activeButton.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [activeTab]);

  return (
    <div>
      {/* Desktop: Horizontal tab bar */}
      <div className="hidden md:block mb-6">
        <div
          ref={tabBarRef}
          className="flex gap-1 overflow-x-auto scrollbar-hide rounded-lg border border-slate-200 bg-white p-1"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical list */}
      <div className="md:hidden mb-6">
        <MobileTabList
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'profile' && (
          <ProfileTab
            initialProfile={props.profile}
            userEmail={props.userEmail}
          />
        )}
        {activeTab === 'meeting-spot' && (
          <MeetingSpotTab initialProfile={props.profile} />
        )}
        {activeTab === 'trip-types' && (
          <TripTypesTab
            initialTripTypes={props.tripTypes}
            captainId={props.profile?.id}
            subscriptionTier={(props.profile?.subscription_tier as SubscriptionTier) ?? 'deckhand'}
          />
        )}
        {activeTab === 'vessels' && (
          <VesselsTab
            initialVessels={props.vessels}
            subscriptionTier={(props.profile?.subscription_tier as SubscriptionTier) ?? 'deckhand'}
          />
        )}
        {activeTab === 'availability' && (
          <AvailabilityTab
            initialProfile={props.profile}
            initialAvailabilityWindows={props.availabilityWindows}
          />
        )}
        {activeTab === 'waivers' && (
          <WaiversTab initialTemplates={props.waiverTemplates} />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab
            stripeAccountId={props.stripeAccountId}
            stripeOnboardingComplete={props.stripeOnboardingComplete}
            businessName={props.profile?.business_name || props.profile?.full_name || ''}
            email={props.userEmail}
            profile={props.profile}
            subscriptionTier={(props.profile?.subscription_tier as SubscriptionTier) ?? 'deckhand'}
          />
        )}
        {activeTab === 'notifications' && (
          <NotificationsTab
            subscriptionTier={(props.profile?.subscription_tier as SubscriptionTier) ?? 'deckhand'}
          />
        )}
        {activeTab === 'booking-page' && (
          <BookingPageTab
            initialProfile={props.profile}
            tripTypes={props.tripTypes}
            subscriptionTier={(props.profile?.subscription_tier as SubscriptionTier) ?? 'deckhand'}
          />
        )}
        {activeTab === 'advanced' && (
          <AdvancedTab
            initialProfile={props.profile}
            calendarToken={props.calendarToken}
            subscriptionTier={(props.profile?.subscription_tier as SubscriptionTier) ?? 'deckhand'}
          />
        )}
      </div>
    </div>
  );
}

function MobileTabList({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: TabDefinition[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const activeTabDef = tabs.find((t) => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabDef.icon;

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
      >
        <div className="flex items-center gap-3">
          <ActiveIcon className="h-5 w-5 text-cyan-600" />
          <span className="text-sm font-medium text-slate-900">{activeTabDef.label}</span>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
              setIsExpanded(false);
            }}
            className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-b border-slate-200/50 last:border-b-0 ${
              isActive
                ? 'bg-white text-slate-900'
                : 'text-slate-400 hover:text-slate-700 hover:bg-white'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-cyan-600' : ''}`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
