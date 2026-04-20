const CONTINENT_RULES = [
  {
    label: 'North America',
    match: (lat: number, lon: number) => lat >= 7 && lat <= 83 && lon >= -168 && lon <= -52
  },
  {
    label: 'South America',
    match: (lat: number, lon: number) => lat >= -56 && lat <= 13 && lon >= -81 && lon <= -34
  },
  {
    label: 'Europe',
    match: (lat: number, lon: number) => lat >= 34 && lat <= 72 && lon >= -26 && lon <= 45
  },
  {
    label: 'Africa',
    match: (lat: number, lon: number) => lat >= -35 && lat <= 37 && lon >= -20 && lon <= 52
  },
  {
    label: 'Asia',
    match: (lat: number, lon: number) => lat >= 1 && lat <= 78 && lon >= 26 && lon <= 180
  },
  {
    label: 'Oceania',
    match: (lat: number, lon: number) => lat >= -50 && lat <= 0 && lon >= 110 && lon <= 180
  }
] as const;

function subRegion(lat: number, lon: number): string {
  if (lat > 45 && lon < -50) return 'Northern belt';
  if (lat > 20 && lon > 70) return 'Eastern belt';
  if (lat < -10 && lon > 110) return 'Southern arc';
  if (lat < -10 && lon < -40) return 'Southern belt';
  if (lat > 0 && lat < 30 && lon > -20 && lon < 50) return 'Equatorial transition';
  return 'Central region';
}

export function regionHint(lat: number, lon: number): string {
  const continent = CONTINENT_RULES.find((rule) => rule.match(lat, lon))?.label ?? 'Unknown region';
  return `${continent} - ${subRegion(lat, lon)}`;
}

export function clampLat(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

export function clampLon(lon: number): number {
  return Math.max(-180, Math.min(180, lon));
}
