'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { BookingWithDetails, Profile } from '@/lib/db/types';

// ============================================================================
// Types
// ============================================================================

export type DockView = 'home' | 'manifest' | 'weather';

export interface DockTrip {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  tripType: string;
  guestName: string;
  guestPhone: string | null;
  partySize: number;
  status: string;
  paymentStatus: string;
  isPaid: boolean;
  waiversComplete: boolean;
  waiversSigned: number;
  waiversTotal: number;
}

export interface DockWeatherData {
  temperature: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  waveHeight: number | null;
  conditions: string | null;
  forecast: Array<{
    time: string;
    temperature: number;
    windSpeed: number;
    conditions: string;
  }>;
  hasWarning: boolean;
  warningMessage: string | null;
}

interface DockModeContextType {
  // Current view state
  currentView: DockView;
  setCurrentView: (view: DockView) => void;

  // Trip data
  currentTrip: DockTrip | null;
  setCurrentTrip: (trip: DockTrip | null) => void;
  todayTrips: DockTrip[];
  setTodayTrips: (trips: DockTrip[]) => void;

  // Weather data
  weather: DockWeatherData | null;
  setWeather: (weather: DockWeatherData | null) => void;

  // Captain info
  captainPhone: string | null;
  setCaptainPhone: (phone: string | null) => void;
  captainName: string | null;
  setCaptainName: (name: string | null) => void;
  timezone: string;
  setTimezone: (tz: string) => void;

  // Manifest data for current trip
  passengers: Array<{
    id: string;
    name: string;
    phone: string | null;
    waiverSigned: boolean;
    isCheckedIn: boolean;
  }>;
  setPassengers: (passengers: Array<{
    id: string;
    name: string;
    phone: string | null;
    waiverSigned: boolean;
    isCheckedIn: boolean;
  }>) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Actions
  refreshData: () => Promise<void>;
  markTripComplete: () => Promise<void>;
  setWeatherHold: () => Promise<void>;

  // Navigation helpers
  goBack: () => void;
  goToManifest: () => void;
  goToWeather: () => void;
}

const DockModeContext = createContext<DockModeContextType | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface DockModeProviderProps {
  children: React.ReactNode;
  initialTrips?: DockTrip[];
  initialWeather?: DockWeatherData | null;
  captainPhone?: string | null;
  captainName?: string | null;
  timezone?: string;
}

export function DockModeProvider({
  children,
  initialTrips = [],
  initialWeather = null,
  captainPhone: initialCaptainPhone = null,
  captainName: initialCaptainName = null,
  timezone: initialTimezone = 'America/New_York',
}: DockModeProviderProps) {
  const [currentView, setCurrentView] = useState<DockView>('home');
  const [currentTrip, setCurrentTrip] = useState<DockTrip | null>(
    initialTrips.length > 0 ? initialTrips[0] : null
  );
  const [todayTrips, setTodayTrips] = useState<DockTrip[]>(initialTrips);
  const [weather, setWeather] = useState<DockWeatherData | null>(initialWeather);
  const [captainPhone, setCaptainPhone] = useState<string | null>(initialCaptainPhone);
  const [captainName, setCaptainName] = useState<string | null>(initialCaptainName);
  const [timezone, setTimezone] = useState<string>(initialTimezone);
  const [passengers, setPassengers] = useState<Array<{
    id: string;
    name: string;
    phone: string | null;
    waiverSigned: boolean;
    isCheckedIn: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-select current/next trip
  useEffect(() => {
    if (todayTrips.length > 0 && !currentTrip) {
      // Find the current or next upcoming trip
      const now = new Date();
      const upcomingTrip = todayTrips.find(trip => {
        const tripEnd = new Date(trip.scheduledEnd);
        return tripEnd > now;
      });
      setCurrentTrip(upcomingTrip || todayTrips[0]);
    }
  }, [todayTrips, currentTrip]);

  // Fetch passengers when trip changes
  useEffect(() => {
    if (currentTrip) {
      fetchPassengers(currentTrip.id);
    }
  }, [currentTrip?.id]);

  const fetchPassengers = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/dock/passengers?bookingId=${bookingId}`);
      if (response.ok) {
        const data = await response.json();
        setPassengers(data.passengers || []);
      }
    } catch (error) {
      console.error('Failed to fetch passengers:', error);
    }
  };

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dock/today');
      if (response.ok) {
        const data = await response.json();
        setTodayTrips(data.trips || []);
        setWeather(data.weather || null);
        if (currentTrip) {
          const updatedTrip = data.trips?.find((t: DockTrip) => t.id === currentTrip.id);
          if (updatedTrip) {
            setCurrentTrip(updatedTrip);
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh dock data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip]);

  const markTripComplete = useCallback(async () => {
    if (!currentTrip) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${currentTrip.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (response.ok) {
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to mark trip complete:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip, refreshData]);

  const setWeatherHold = useCallback(async () => {
    if (!currentTrip) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${currentTrip.id}/weather-hold`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Weather conditions' }),
      });
      if (response.ok) {
        await refreshData();
      }
    } catch (error) {
      console.error('Failed to set weather hold:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentTrip, refreshData]);

  const goBack = useCallback(() => {
    setCurrentView('home');
  }, []);

  const goToManifest = useCallback(() => {
    setCurrentView('manifest');
  }, []);

  const goToWeather = useCallback(() => {
    setCurrentView('weather');
  }, []);

  return (
    <DockModeContext.Provider
      value={{
        currentView,
        setCurrentView,
        currentTrip,
        setCurrentTrip,
        todayTrips,
        setTodayTrips,
        weather,
        setWeather,
        captainPhone,
        setCaptainPhone,
        captainName,
        setCaptainName,
        timezone,
        setTimezone,
        passengers,
        setPassengers,
        isLoading,
        setIsLoading,
        refreshData,
        markTripComplete,
        setWeatherHold,
        goBack,
        goToManifest,
        goToWeather,
      }}
    >
      {children}
    </DockModeContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useDockMode() {
  const context = useContext(DockModeContext);
  if (!context) {
    throw new Error('useDockMode must be used within a DockModeProvider');
  }
  return context;
}
