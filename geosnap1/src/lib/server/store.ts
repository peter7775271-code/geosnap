import { nanoid } from 'nanoid';

import { LOBBY_CODE_LENGTH } from '@/lib/constants';
import { calculateRoundScore, haversineDistanceKm } from '@/lib/scoring';
import type { GameMode, GameRound, GameSession, GuessResult, LeaderboardEntry } from '@/types/game';

interface CreateSessionInput {
  hostUserId: string;
  mode: GameMode;
  roundCount: number;
  timerSeconds: number | null;
  rounds: Array<{
    photoHash: string;
    actualLat: number;
    actualLon: number;
  }>;
}

interface GuessInput {
  roundId: string;
  userId: string;
  guessLat: number;
  guessLon: number;
  timeTakenMs: number;
  hintUsed: boolean;
  streakCount: number;
}

const sessionsById = new Map<string, GameSession>();
const sessionsByCode = new Map<string, string>();
const guessesByRound = new Map<string, GuessResult[]>();

function generateJoinCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  for (let index = 0; index < LOBBY_CODE_LENGTH; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  if (sessionsByCode.has(code)) {
    return generateJoinCode();
  }

  return code;
}

export function createSession(input: CreateSessionInput): GameSession {
  const id = nanoid(12);
  const code = generateJoinCode();

  const rounds: GameRound[] = input.rounds.slice(0, input.roundCount).map((round, idx) => ({
    id: nanoid(14),
    sessionId: id,
    photoHash: round.photoHash,
    actualLat: round.actualLat,
    actualLon: round.actualLon,
    roundIndex: idx
  }));

  const session: GameSession = {
    id,
    code,
    hostUserId: input.hostUserId,
    mode: input.mode,
    roundCount: rounds.length,
    timerSeconds: input.timerSeconds,
    createdAt: new Date().toISOString(),
    status: 'waiting',
    players: [input.hostUserId],
    rounds
  };

  sessionsById.set(id, session);
  sessionsByCode.set(code, id);
  return session;
}

export function getSessionByCode(code: string): GameSession | null {
  const sessionId = sessionsByCode.get(code.toUpperCase());
  if (!sessionId) {
    return null;
  }

  return sessionsById.get(sessionId) ?? null;
}

export function getSessionById(id: string): GameSession | null {
  return sessionsById.get(id) ?? null;
}

export function joinSession(sessionId: string, userId: string): GameSession | null {
  const session = sessionsById.get(sessionId);
  if (!session) {
    return null;
  }

  if (!session.players.includes(userId)) {
    session.players.push(userId);
  }

  sessionsById.set(sessionId, session);
  return session;
}

export function markSessionStatus(sessionId: string, status: GameSession['status']): GameSession | null {
  const session = sessionsById.get(sessionId);
  if (!session) {
    return null;
  }

  session.status = status;
  sessionsById.set(sessionId, session);
  return session;
}

export function submitGuess(input: GuessInput): GuessResult | null {
  let targetRound: GameRound | null = null;

  for (const session of sessionsById.values()) {
    const found = session.rounds.find((round) => round.id === input.roundId);
    if (found) {
      targetRound = found;
      break;
    }
  }

  if (!targetRound) {
    return null;
  }

  const distanceKm = haversineDistanceKm(
    input.guessLat,
    input.guessLon,
    targetRound.actualLat,
    targetRound.actualLon
  );

  const breakdown = calculateRoundScore({
    distanceKm,
    timeTakenMs: input.timeTakenMs,
    streakCount: input.streakCount,
    hintUsed: input.hintUsed
  });

  const guess: GuessResult = {
    id: nanoid(14),
    roundId: input.roundId,
    userId: input.userId,
    guessLat: input.guessLat,
    guessLon: input.guessLon,
    distanceKm,
    score: breakdown.final,
    submittedAt: new Date().toISOString(),
    timeTakenMs: input.timeTakenMs,
    speedBonus: breakdown.speedBonus,
    streakMultiplier: breakdown.streakMultiplier,
    hintPenaltyApplied: breakdown.hintPenaltyApplied
  };

  const roundGuesses = guessesByRound.get(input.roundId) ?? [];
  const existingGuessIndex = roundGuesses.findIndex((entry) => entry.userId === input.userId);

  if (existingGuessIndex >= 0) {
    roundGuesses[existingGuessIndex] = guess;
  } else {
    roundGuesses.push(guess);
  }

  guessesByRound.set(input.roundId, roundGuesses);
  return guess;
}

export function getGuessesForRound(roundId: string): GuessResult[] {
  return guessesByRound.get(roundId) ?? [];
}

export function getLeaderboard(sessionId: string): LeaderboardEntry[] {
  const session = sessionsById.get(sessionId);
  if (!session) {
    return [];
  }

  const aggregate = new Map<string, { score: number; distance: number; guesses: number }>();

  for (const round of session.rounds) {
    const roundGuesses = guessesByRound.get(round.id) ?? [];
    for (const guess of roundGuesses) {
      const previous = aggregate.get(guess.userId) ?? { score: 0, distance: 0, guesses: 0 };
      previous.score += guess.score;
      previous.distance += guess.distanceKm;
      previous.guesses += 1;
      aggregate.set(guess.userId, previous);
    }
  }

  return [...aggregate.entries()]
    .map(([userId, values]) => ({
      userId,
      totalScore: values.score,
      averageDistanceKm: values.guesses > 0 ? values.distance / values.guesses : 0,
      guesses: values.guesses
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}
