'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface RefreshWeatherButtonProps {
  lat: number;
  lon: number;
}

export function RefreshWeatherButton({ lat, lon }: RefreshWeatherButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loading = isRefreshing || isPending;

  const handleRefresh = async () => {
    if (loading) return;
    setIsRefreshing(true);
    try {
      await fetch('/api/weather/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon }),
      });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      console.error('Failed to refresh weather:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] text-slate-500 transition-colors hover:bg-white/10 hover:text-cyan-400 disabled:opacity-50"
      title="Refresh weather data"
    >
      <RefreshCw className={`h-2.5 w-2.5 ${loading ? 'animate-spin' : ''}`} />
      <span>Refresh</span>
    </button>
  );
}
