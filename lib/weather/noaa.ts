/**
 * NOAA Marine Weather API Integration
 * 
 * Free, no API key required
 * Data sources:
 * - Marine forecasts
 * - Small craft advisories
 * - Weather observations
 * 
 * Docs: https://www.weather.gov/documentation/services-web-api
 */

export interface NOAAAlert {
  event: string; // e.g., "Small Craft Advisory"
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor' | 'Unknown';
  certainty: 'Observed' | 'Likely' | 'Possible' | 'Unlikely' | 'Unknown';
  urgency: 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown';
  headline: string;
  description: string;
  instruction?: string;
  effective: string; // ISO timestamp
  expires: string; // ISO timestamp
  areas: string[];
}

export interface NOAAForecast {
  periods: {
    number: number;
    name: string; // "Today", "Tonight", etc.
    startTime: string;
    endTime: string;
    temperature: number;
    temperatureUnit: 'F' | 'C';
    windSpeed: string; // e.g., "10 to 15 mph"
    windDirection: string; // e.g., "SW"
    shortForecast: string;
    detailedForecast: string;
  }[];
}

export interface MarineWeatherConditions {
  isSafe: boolean;
  alerts: NOAAAlert[];
  forecast?: NOAAForecast | null;
  windSpeed?: string;
  waveHeight?: string;
  visibility?: string;
  recommendation: 'safe' | 'caution' | 'dangerous';
  reason?: string;
}

/**
 * Get grid coordinates for a lat/lon
 * Required for fetching forecast data
 */
async function getGridPoint(lat: number, lon: number): Promise<{ gridId: string; gridX: number; gridY: number }> {
  const response = await fetch(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    {
      headers: {
        'User-Agent': '(DockSlot Marina Booking, contact@dockslot.app)',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`NOAA API error: ${response.status}`);
  }

  const data = await response.json();
  
  return {
    gridId: data.properties.gridId,
    gridX: data.properties.gridX,
    gridY: data.properties.gridY,
  };
}

/**
 * Get active weather alerts for a location
 */
export async function getWeatherAlerts(lat: number, lon: number): Promise<NOAAAlert[]> {
  try {
    const response = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`,
      {
        headers: {
          'User-Agent': '(DockSlot Marina Booking, contact@dockslot.app)',
        },
      }
    );

    if (!response.ok) {
      console.error('NOAA alerts API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    return (data.features || []).map((feature: any) => ({
      event: feature.properties.event,
      severity: feature.properties.severity,
      certainty: feature.properties.certainty,
      urgency: feature.properties.urgency,
      headline: feature.properties.headline,
      description: feature.properties.description,
      instruction: feature.properties.instruction,
      effective: feature.properties.effective,
      expires: feature.properties.expires,
      areas: feature.properties.areaDesc?.split(';').map((s: string) => s.trim()) || [],
    }));
  } catch (error) {
    console.error('Failed to fetch NOAA alerts:', error);
    return [];
  }
}

/**
 * Get marine forecast for a location
 */
export async function getMarineForecast(lat: number, lon: number): Promise<NOAAForecast | null> {
  try {
    const grid = await getGridPoint(lat, lon);
    
    const response = await fetch(
      `https://api.weather.gov/gridpoints/${grid.gridId}/${grid.gridX},${grid.gridY}/forecast`,
      {
        headers: {
          'User-Agent': '(DockSlot Marina Booking, contact@dockslot.app)',
        },
      }
    );

    if (!response.ok) {
      console.error('NOAA forecast API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    return {
      periods: data.properties.periods.map((period: any) => ({
        number: period.number,
        name: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
        temperature: period.temperature,
        temperatureUnit: period.temperatureUnit,
        windSpeed: period.windSpeed,
        windDirection: period.windDirection,
        shortForecast: period.shortForecast,
        detailedForecast: period.detailedForecast,
      })),
    };
  } catch (error) {
    console.error('Failed to fetch NOAA forecast:', error);
    return null;
  }
}

/**
 * Check if marine conditions are safe for charter
 * Returns safety assessment with reasoning
 */
export async function checkMarineConditions(
  lat: number,
  lon: number,
  tripDate: Date
): Promise<MarineWeatherConditions> {
  const alerts = await getWeatherAlerts(lat, lon);
  const forecast = await getMarineForecast(lat, lon);

  // Check for marine-related alerts
  const marineAlerts = alerts.filter(alert =>
    alert.event.toLowerCase().includes('craft') ||
    alert.event.toLowerCase().includes('marine') ||
    alert.event.toLowerCase().includes('gale') ||
    alert.event.toLowerCase().includes('storm') ||
    alert.event.toLowerCase().includes('wind')
  );

  // Dangerous conditions
  const dangerousAlerts = marineAlerts.filter(
    alert => alert.severity === 'Severe' || alert.severity === 'Extreme'
  );

  if (dangerousAlerts.length > 0) {
    return {
      isSafe: false,
      alerts: marineAlerts,
      forecast,
      recommendation: 'dangerous',
      reason: dangerousAlerts.map(a => a.headline).join('; '),
    };
  }

  // Caution conditions (Small Craft Advisory, etc.)
  if (marineAlerts.length > 0) {
    return {
      isSafe: false,
      alerts: marineAlerts,
      forecast,
      recommendation: 'caution',
      reason: marineAlerts.map(a => a.headline).join('; '),
    };
  }

  // Check wind speed from forecast
  if (forecast && forecast.periods.length > 0) {
    const relevantPeriod = forecast.periods[0]; // Today's forecast
    const windSpeed = relevantPeriod.windSpeed;
    
    // Parse wind speed (e.g., "15 to 20 mph")
    const windMatch = windSpeed.match(/(\d+)\s*(?:to\s*(\d+))?\s*mph/);
    if (windMatch) {
      const maxWind = parseInt(windMatch[2] || windMatch[1]);
      
      // Unsafe above 25 mph for small craft
      if (maxWind > 25) {
        return {
          isSafe: false,
          alerts: marineAlerts,
          forecast,
          windSpeed,
          recommendation: 'caution',
          reason: `High winds forecasted: ${windSpeed}`,
        };
      }
    }
  }

  // Conditions look safe
  return {
    isSafe: true,
    alerts: marineAlerts,
    forecast,
    windSpeed: forecast?.periods[0]?.windSpeed,
    recommendation: 'safe',
  };
}

/**
 * Generate weather hold reason from NOAA data
 */
export function generateWeatherHoldReason(conditions: MarineWeatherConditions): string {
  if (conditions.alerts.length > 0) {
    const alert = conditions.alerts[0];
    return `${alert.event}: ${alert.headline}${alert.instruction ? ` ${alert.instruction}` : ''}`;
  }

  if (conditions.windSpeed) {
    return `Unsafe wind conditions forecasted: ${conditions.windSpeed}`;
  }

  if (conditions.reason) {
    return conditions.reason;
  }

  return 'Unfavorable weather conditions forecasted for safe charter operations';
}
