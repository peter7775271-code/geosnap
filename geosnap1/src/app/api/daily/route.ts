import { NextResponse } from 'next/server';

import { createSession } from '@/lib/server/store';

const DAILY_COORDINATES = [
  { photoHash: 'daily-1', actualLat: 48.8584, actualLon: 2.2945 },
  { photoHash: 'daily-2', actualLat: 35.6586, actualLon: 139.7454 },
  { photoHash: 'daily-3', actualLat: -33.8568, actualLon: 151.2153 },
  { photoHash: 'daily-4', actualLat: 40.6892, actualLon: -74.0445 },
  { photoHash: 'daily-5', actualLat: -13.1631, actualLon: -72.545 }
];

export async function GET() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const offset = dayOfYear % DAILY_COORDINATES.length;

  const rounds = Array.from({ length: 3 }).map((_, idx) => DAILY_COORDINATES[(offset + idx) % DAILY_COORDINATES.length]);

  const session = createSession({
    hostUserId: 'daily-challenge',
    mode: 'daily',
    roundCount: rounds.length,
    timerSeconds: 60,
    rounds
  });

  return NextResponse.json({
    date: new Date().toISOString().slice(0, 10),
    sessionId: session.id,
    joinCode: session.code,
    rounds: session.rounds
  });
}
