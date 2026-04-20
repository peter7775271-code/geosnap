import { NextResponse } from 'next/server';

const REGION_FALLBACKS = [
  { region: 'Europe - Central region', lat: 48.2082, lon: 16.3738 },
  { region: 'North America - Central region', lat: 39.8283, lon: -98.5795 },
  { region: 'Asia - Eastern belt', lat: 35.6764, lon: 139.65 },
  { region: 'Oceania - Southern arc', lat: -33.8688, lon: 151.2093 }
];

interface LocateBody {
  fileName?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as LocateBody;
  const seed = body?.fileName ?? String(Date.now());

  const hash = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pick = REGION_FALLBACKS[hash % REGION_FALLBACKS.length];

  return NextResponse.json({
    region: pick.region,
    lat: pick.lat,
    lon: pick.lon,
    confidence: 0.35,
    note: 'Replace this heuristic with Anthropic Vision inference when API credentials are provided.'
  });
}
