import { nanoid } from 'nanoid';
import { NextResponse } from 'next/server';

import { getSessionByCode, joinSession } from '@/lib/server/store';

interface JoinBody {
  userId?: string;
}

export async function POST(request: Request, context: { params: { id: string } }) {
  const body = (await request.json()) as JoinBody;
  const userId = body?.userId ?? `guest_${nanoid(8)}`;

  const token = context.params.id;
  const resolvedSession = getSessionByCode(token);
  const sessionId = resolvedSession?.id ?? token;

  const session = joinSession(sessionId, userId);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    userId,
    sessionId: session.id,
    players: session.players
  });
}
