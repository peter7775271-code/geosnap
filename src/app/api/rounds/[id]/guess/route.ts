import { NextResponse } from 'next/server';

import { submitGuess } from '@/lib/server/store';

interface GuessBody {
  userId: string;
  guessLat: number;
  guessLon: number;
  timeTakenMs: number;
  hintUsed?: boolean;
  streakCount?: number;
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = (await request.json()) as GuessBody;

  if (!body?.userId || typeof body?.guessLat !== 'number' || typeof body?.guessLon !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const guess = submitGuess({
    roundId: context.params.id,
    userId: body.userId,
    guessLat: body.guessLat,
    guessLon: body.guessLon,
    timeTakenMs: Math.max(0, body.timeTakenMs || 0),
    hintUsed: Boolean(body.hintUsed),
    streakCount: Math.max(0, body.streakCount || 0)
  });

  if (!guess) {
    return NextResponse.json({ error: 'Round not found' }, { status: 404 });
  }

  return NextResponse.json({
    distanceKm: guess.distanceKm,
    score: guess.score,
    speedBonus: guess.speedBonus,
    streakMultiplier: guess.streakMultiplier,
    hintPenaltyApplied: guess.hintPenaltyApplied,
    submittedAt: guess.submittedAt
  });
}
