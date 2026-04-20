export type GameMode = 'solo' | 'multiplayer' | 'daily';
export type SessionStatus = 'waiting' | 'active' | 'finished';

export interface LatLng {
  lat: number;
  lon: number;
}

export interface PhotoItem {
  id: string;
  name: string;
  url: string;
  hash: string;
  fileType: string;
  size: number;
  gps: LatLng | null;
  inferredRegion?: string;
}

export interface GameRound {
  id: string;
  sessionId: string;
  photoHash: string;
  actualLat: number;
  actualLon: number;
  roundIndex: number;
}

export interface GuessResult {
  id: string;
  roundId: string;
  userId: string;
  guessLat: number;
  guessLon: number;
  distanceKm: number;
  score: number;
  submittedAt: string;
  timeTakenMs: number;
  speedBonus: number;
  streakMultiplier: number;
  hintPenaltyApplied: boolean;
}

export interface GameSession {
  id: string;
  code: string;
  hostUserId: string;
  mode: GameMode;
  roundCount: number;
  timerSeconds: number | null;
  createdAt: string;
  status: SessionStatus;
  players: string[];
  rounds: GameRound[];
}

export interface ScoreBreakdown {
  base: number;
  speedBonus: number;
  streakMultiplier: number;
  hintPenaltyApplied: boolean;
  final: number;
}

export interface LeaderboardEntry {
  userId: string;
  totalScore: number;
  averageDistanceKm: number;
  guesses: number;
}
