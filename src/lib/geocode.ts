// Approximate coordinates for common gemach cities
const CITY_COORDS: Record<string, [number, number]> = {
  "Brooklyn,NY": [40.6782, -73.9442],
  "Lakewood,NJ": [40.097, -74.217],
  "Monsey,NY": [41.1119, -74.0685],
  "Passaic,NJ": [40.8568, -74.1285],
  "Baltimore,MD": [39.2904, -76.6122],
  "Los Angeles,CA": [34.0522, -118.2437],
  "Chicago,IL": [41.8781, -87.6298],
  "Toronto,ON": [43.6532, -79.3832],
  "Miami Beach,FL": [25.7907, -80.13],
  "Cleveland,OH": [41.4993, -81.6944],
  "Monroe,NY": [41.3301, -74.1868],
  "New York,NY": [40.7128, -74.006],
  "Detroit,MI": [42.3314, -83.0458],
  "Boston,MA": [42.3601, -71.0589],
  "Houston,TX": [29.7604, -95.3698],
  "Montreal,QC": [45.5017, -73.5673],
  "Philadelphia,PA": [39.9526, -75.1652],
};

export function getCityCoords(city: string, state: string): [number, number] | null {
  const key = `${city},${state}`;
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // Try just the city
  const cityOnly = Object.entries(CITY_COORDS).find(([k]) => k.startsWith(`${city},`));
  return cityOnly ? cityOnly[1] : null;
}

export function getCoords(gemach: { latitude?: number | null; longitude?: number | null; city: string; state: string }): [number, number] | null {
  if (gemach.latitude && gemach.longitude) {
    return [gemach.latitude, gemach.longitude];
  }
  return getCityCoords(gemach.city, gemach.state);
}
