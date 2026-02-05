'use client';

// app/dock/DockModeClient.tsx
// Main Dock Mode Client Component
// Handles view switching and renders appropriate components

import { DockModeProvider, DockTrip, DockWeatherData, useDockMode } from './context/DockModeContext';
import { DockModeHome } from './components/DockModeHome';
import { DockManifest } from './components/DockManifest';
import { DockWeatherView } from './components/DockWeatherView';

interface DockModeClientProps {
  initialTrips: DockTrip[];
  initialWeather: DockWeatherData | null;
  captainPhone: string | null;
  captainName: string | null;
  timezone: string;
}

export function DockModeClient({
  initialTrips,
  initialWeather,
  captainPhone,
  captainName,
  timezone,
}: DockModeClientProps) {
  return (
    <DockModeProvider
      initialTrips={initialTrips}
      initialWeather={initialWeather}
      captainPhone={captainPhone}
      captainName={captainName}
      timezone={timezone}
    >
      <DockModeContent />
    </DockModeProvider>
  );
}

function DockModeContent() {
  const { currentView } = useDockMode();

  switch (currentView) {
    case 'manifest':
      return <DockManifest />;
    case 'weather':
      return <DockWeatherView />;
    case 'home':
    default:
      return <DockModeHome />;
  }
}
