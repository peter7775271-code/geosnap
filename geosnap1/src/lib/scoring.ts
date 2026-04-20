import { MAX_SCORE_PER_ROUND } from '@/lib/constants';
import type { ScoreBreakdown } from '@/types/game';

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

export function calculateBaseScore(distanceKm: number): number {
  return Math.round(MAX_SCORE_PER_ROUND * Math.exp(-distanceKm / 2000));
}

export function calculateSpeedBonus(timeTakenMs: number): number {
  if (timeTakenMs <= 0 || timeTakenMs > 15000) {
    return 0;
  }

  const ratio = 1 - timeTakenMs / 15000;
  return Math.round(500 * Math.max(0, ratio));
}

export function calculateRoundScore(params: {
  distanceKm: number;
  timeTakenMs: number;
  streakCount: number;
  hintUsed: boolean;
}): ScoreBreakdown {
  const base = calculateBaseScore(params.distanceKm);
  const speedBonus = calculateSpeedBonus(params.timeTakenMs);
  const streakMultiplier = 1 + Math.max(0, params.streakCount) * 0.1;

  const prePenalty = Math.round((base + speedBonus) * streakMultiplier);
  const final = params.hintUsed ? Math.round(prePenalty * 0.5) : prePenalty;

  return {
    base,
    speedBonus,
    streakMultiplier,
    hintPenaltyApplied: params.hintUsed,
    final
  };
}

export function scoreGrade(distanceKm: number): string {
  if (distanceKm < 1) return 'Perfect';
  if (distanceKm < 10) return 'Outstanding';
  if (distanceKm < 50) return 'Excellent';
  if (distanceKm < 200) return 'Great';
  if (distanceKm < 500) return 'Good';
  if (distanceKm < 1000) return 'OK';
  if (distanceKm < 2000) return 'Rough';
  if (distanceKm < 5000) return 'Very Far';
  return 'Almost Opposite Side of Earth';
}
