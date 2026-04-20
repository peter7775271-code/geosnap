import { NextResponse } from 'next/server';

import { createSession } from '@/lib/server/store';
import type { GameMode } from '@/types/game';

interface CreateSessionBody {
  hostUserId: string;
  mode: GameMode;
  roundCount: number;
  timerSeconds?: number | null;
  rounds: Array<{
    photoHash: string;
    actualLat: number;
    actualLon: number;
  }>;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSessionBody;

  if (!body?.hostUserId || !body?.mode || !Array.isArray(body.rounds) || body.rounds.length === 0) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const session = createSession({
    hostUserId: body.hostUserId,
    mode: body.mode,
    roundCount: Math.min(20, Math.max(1, body.roundCount || body.rounds.length)),
    timerSeconds: typeof body.timerSeconds === 'number' && body.timerSeconds > 0 ? body.timerSeconds : null,
    rounds: body.rounds
  });

  return NextResponse.json({
    sessionId: session.id,
    joinCode: session.code,
    status: session.status
  });
}
