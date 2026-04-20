import { NextResponse } from 'next/server';

import { getSessionByCode, getSessionById, getLeaderboard, markSessionStatus } from '@/lib/server/store';

interface PatchBody {
  status: 'waiting' | 'active' | 'finished';
}

export async function GET(_: Request, context: { params: { id: string } }) {
  const token = context.params.id;
  const session = getSessionByCode(token) ?? getSessionById(token);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({
    session,
    leaderboard: getLeaderboard(session.id)
  });
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const body = (await request.json()) as PatchBody;
  if (!body?.status) {
    return NextResponse.json({ error: 'Missing status' }, { status: 400 });
  }

  const session = markSessionStatus(context.params.id, body.status);
  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ session });
}
