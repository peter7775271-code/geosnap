import { NextResponse } from 'next/server';

interface ShareBody {
  score: number;
  avgDistanceKm: number;
  rounds: number;
}

export async function POST(request: Request) {
  const body = (await request.json()) as ShareBody;

  if (typeof body?.score !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const params = new URLSearchParams({
    score: String(body.score),
    distance: String(Math.round(body.avgDistanceKm || 0)),
    rounds: String(body.rounds || 0)
  });

  return NextResponse.json({
    ogImageUrl: `/share-card?${params.toString()}`
  });
}
