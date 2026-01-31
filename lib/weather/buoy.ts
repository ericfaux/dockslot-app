/**
 * NOAA Buoy Data Integration
 * Fetches real water temperature from NOAA National Data Buoy Center
 * Free API, no key required
 * 
 * Docs: https://www.ndbc.noaa.gov/
 */

interface BuoyStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  distance: number; // km from search point
}

interface BuoyData {
  waterTemperature?: number; // °F
  waveHeight?: number; // feet
  windSpeed?: number; // knots
  windDirection?: string;
  airTemperature?: number; // °F
  timestamp?: string;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearest active buoy stations
 * NOAA provides a station list, but we'll use a curated list of major buoys
 */
async function findNearestBuoy(lat: number, lon: number): Promise<string | null> {
  // Major NOAA buoys (curated list of active stations with water temp sensors)
  // These cover most US coastal waters
  const majorBuoys: BuoyStation[] = [
    // East Coast
    { id: '44013', name: 'Boston Harbor', lat: 42.346, lon: -70.651, distance: 0 },
    { id: '44017', name: 'Montauk Point', lat: 40.694, lon: -72.048, distance: 0 },
    { id: '44025', name: 'Long Island Sound', lat: 40.251, lon: -73.164, distance: 0 },
    { id: '44065', name: 'New York Harbor', lat: 40.369, lon: -73.703, distance: 0 },
    { id: '44009', name: 'Delaware Bay', lat: 38.457, lon: -74.702, distance: 0 },
    { id: '44014', name: 'Virginia Beach', lat: 36.611, lon: -74.836, distance: 0 },
    { id: '41010', name: 'Cape Canaveral', lat: 28.878, lon: -78.485, distance: 0 },
    { id: '41009', name: 'Canaveral East', lat: 28.519, lon: -80.184, distance: 0 },
    { id: '41004', name: 'Charleston', lat: 32.501, lon: -79.099, distance: 0 },
    { id: '41001', name: 'East Hatteras', lat: 34.68, lon: -72.73, distance: 0 },
    
    // Gulf of Mexico
    { id: '42001', name: 'Gulf of Mexico - Mid', lat: 25.897, lon: -89.658, distance: 0 },
    { id: '42003', name: 'Gulf of Mexico - East', lat: 26.04, lon: -85.612, distance: 0 },
    { id: '42019', name: 'Tampa Bay', lat: 27.907, lon: -95.352, distance: 0 },
    { id: '42020', name: 'Corpus Christi', lat: 26.968, lon: -96.695, distance: 0 },
    { id: '42035', name: 'Galveston', lat: 29.232, lon: -94.413, distance: 0 },
    { id: '42040', name: 'New Orleans', lat: 29.208, lon: -88.207, distance: 0 },
    
    // West Coast
    { id: '46022', name: 'Eel River', lat: 40.713, lon: -124.516, distance: 0 },
    { id: '46026', name: 'San Francisco', lat: 37.759, lon: -122.82, distance: 0 },
    { id: '46042', name: 'Monterey Bay', lat: 36.785, lon: -122.398, distance: 0 },
    { id: '46011', name: 'Santa Maria', lat: 34.867, lon: -120.861, distance: 0 },
    { id: '46025', name: 'Santa Monica Bay', lat: 33.749, lon: -119.053, distance: 0 },
    { id: '46047', name: 'San Diego', lat: 32.434, lon: -119.533, distance: 0 },
    { id: '46069', name: 'San Nicolas Island', lat: 33.67, lon: -120.21, distance: 0 },
    
    // Pacific Northwest
    { id: '46050', name: 'Astoria', lat: 44.656, lon: -124.523, distance: 0 },
    { id: '46029', name: 'Columbia River', lat: 46.144, lon: -124.51, distance: 0 },
    { id: '46041', name: 'Cape Elizabeth', lat: 47.353, lon: -124.731, distance: 0 },
    
    // Alaska
    { id: '46080', name: 'Seward', lat: 59.916, lon: -149.438, distance: 0 },
    { id: '46082', name: 'Sitka', lat: 56.996, lon: -135.09, distance: 0 },
    
    // Hawaii
    { id: '51001', name: 'Northwest Hawaii', lat: 23.445, lon: -162.279, distance: 0 },
    { id: '51002', name: 'South Hawaii', lat: 17.054, lon: -157.759, distance: 0 },
    { id: '51003', name: 'Mokapu Point', lat: 19.215, lon: -160.851, distance: 0 },
  ];

  // Calculate distances
  majorBuoys.forEach((buoy) => {
    buoy.distance = calculateDistance(lat, lon, buoy.lat, buoy.lon);
  });

  // Sort by distance
  majorBuoys.sort((a, b) => a.distance - b.distance);

  // Return nearest buoy within 200km
  const nearest = majorBuoys[0];
  if (nearest && nearest.distance < 200) {
    return nearest.id;
  }

  return null;
}

/**
 * Fetch latest buoy data
 */
export async function getBuoyData(lat: number, lon: number): Promise<BuoyData | null> {
  try {
    const buoyId = await findNearestBuoy(lat, lon);
    
    if (!buoyId) {
      console.log('No nearby buoy found within 200km');
      return null;
    }

    // Fetch latest observations from NOAA
    const response = await fetch(
      `https://www.ndbc.noaa.gov/data/realtime2/${buoyId}.txt`,
      {
        headers: {
          'User-Agent': '(DockSlot Marina Booking, contact@dockslot.app)',
        },
      }
    );

    if (!response.ok) {
      console.error(`NOAA buoy API error for ${buoyId}:`, response.status);
      return null;
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    
    // Skip header lines (first 2 lines)
    if (lines.length < 3) {
      return null;
    }

    // Parse latest data line (line 2, index 2)
    const dataLine = lines[2].trim().split(/\s+/);
    
    // NOAA format: YY MM DD hh mm WDIR WSPD GST WVHT DPD APD MWD PRES ATMP WTMP DEWP VIS TIDE
    // Indexes:     0  1  2  3  4  5    6    7   8    9   10  11  12   13   14   15   16  17
    
    const waterTemp = parseFloat(dataLine[14]); // WTMP in Celsius
    const waveHeight = parseFloat(dataLine[8]); // WVHT in meters
    const windSpeed = parseFloat(dataLine[6]); // WSPD in m/s
    const windDir = parseInt(dataLine[5]); // WDIR in degrees
    
    // Convert to imperial units
    const waterTempF = waterTemp !== 999 && !isNaN(waterTemp) ? waterTemp * 9/5 + 32 : undefined;
    const waveHeightFt = waveHeight !== 99 && !isNaN(waveHeight) ? waveHeight * 3.28084 : undefined;
    const windSpeedKts = windSpeed !== 99 && !isNaN(windSpeed) ? windSpeed * 1.94384 : undefined;
    
    // Convert wind direction to compass
    const getWindDirection = (degrees: number): string => {
      if (isNaN(degrees) || degrees === 999) return 'N/A';
      const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const index = Math.round(degrees / 22.5) % 16;
      return directions[index];
    };

    return {
      waterTemperature: waterTempF,
      waveHeight: waveHeightFt,
      windSpeed: windSpeedKts,
      windDirection: getWindDirection(windDir),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Failed to fetch buoy data:', error);
    return null;
  }
}
