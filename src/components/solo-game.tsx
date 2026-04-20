'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

import { regionHint } from '@/lib/geo';
import { calculateRoundScore, haversineDistanceKm, scoreGrade } from '@/lib/scoring';
import type { LatLng, PhotoItem } from '@/types/game';
import { MapGuesser } from '@/components/map-guesser';

interface RoundResult {
  photoId: string;
  distanceKm: number;
  score: number;
  base: number;
  speedBonus: number;
  streakMultiplier: number;
  hintUsed: boolean;
  grade: string;
}

interface SoloGameProps {
  photos: PhotoItem[];
  onExit: () => void;
}

export function SoloGame({ photos, onExit }: SoloGameProps) {
  const playable = useMemo(() => photos.filter((photo) => photo.gps), [photos]);

  const [roundIndex, setRoundIndex] = useState(0);
  const [guess, setGuess] = useState<LatLng | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [currentResult, setCurrentResult] = useState<RoundResult | null>(null);

  const [roundStartedAt, setRoundStartedAt] = useState<number>(() => Date.now());

  const currentPhoto = playable[roundIndex] ?? null;
  const actual = currentPhoto?.gps ?? null;

  useEffect(() => {
    if (showResult || !currentPhoto) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - roundStartedAt);
    }, 150);

    return () => window.clearInterval(timer);
  }, [currentPhoto, roundStartedAt, showResult]);

  useEffect(() => {
    setElapsedMs(0);
  }, [roundStartedAt]);

  if (!playable.length) {
    return (
      <section className="surface p-6">
        <h2 className="text-2xl font-bold">No GPS-Ready Photos</h2>
        <p className="mt-2 text-sm text-muted">
          This mode needs at least one photo with GPS metadata or inferred coordinates.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Back
        </button>
      </section>
    );
  }

  async function shareResult(totalScore: number, avgDistanceKm: number) {
    const payload = {
      title: 'GeoSnap Score',
      text: `I scored ${totalScore} points on GeoSnap with average distance ${Math.round(avgDistanceKm)} km.`
    };

    if (navigator.share) {
      await navigator.share(payload);
      return;
    }

    await navigator.clipboard.writeText(`${payload.text} Try GeoSnap!`);
  }

  function useHint() {
    if (!actual || hintUsed) {
      return;
    }

    const hint = regionHint(actual.lat, actual.lon);
    setHintText(hint);
    setHintUsed(true);
  }

  function submitGuess() {
    if (!guess || !actual || showResult) {
      return;
    }

    const distanceKm = haversineDistanceKm(guess.lat, guess.lon, actual.lat, actual.lon);
    const breakdown = calculateRoundScore({
      distanceKm,
      timeTakenMs: elapsedMs,
      streakCount: streak,
      hintUsed
    });

    const roundResult: RoundResult = {
      photoId: currentPhoto.id,
      distanceKm,
      score: breakdown.final,
      base: breakdown.base,
      speedBonus: breakdown.speedBonus,
      streakMultiplier: breakdown.streakMultiplier,
      hintUsed,
      grade: scoreGrade(distanceKm)
    };

    setCurrentResult(roundResult);
    setResults((prev) => [...prev, roundResult]);
    setShowResult(true);

    if (navigator.vibrate) {
      navigator.vibrate([20, 50, 20]);
    }
  }

  function nextRound() {
    if (!currentResult) {
      return;
    }

    setStreak(currentResult.distanceKm <= 200 ? streak + 1 : 0);
    setGuess(null);
    setShowResult(false);
    setHintUsed(false);
    setHintText(null);
    setCurrentResult(null);
    setRoundStartedAt(Date.now());
    setRoundIndex((prev) => prev + 1);
  }

  const isFinished = roundIndex >= playable.length;
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const averageDistanceKm = results.length
    ? results.reduce((sum, result) => sum + result.distanceKm, 0) / results.length
    : 0;

  if (isFinished) {
    return (
      <section className="surface p-5 sm:p-6">
        <h2 className="text-3xl font-black tracking-tight">Final Score</h2>
        <p className="mono mt-2 text-4xl text-accent">{totalScore.toLocaleString()} pts</p>
        <p className="mt-1 text-sm text-muted">Average distance: {Math.round(averageDistanceKm)} km</p>

        <div className="mt-5 space-y-2">
          {results.map((result, idx) => (
            <div key={result.photoId} className="flex items-center justify-between rounded-xl bg-surfaceAlt px-3 py-2">
              <span className="text-sm text-muted">Round {idx + 1}</span>
              <div className="text-right">
                <p className="mono text-sm">{result.score.toLocaleString()} pts</p>
                <p className="text-xs text-muted">{Math.round(result.distanceKm)} km</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void shareResult(totalScore, averageDistanceKm)}
            className="rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent"
          >
            Share Results
          </button>
          <button
            type="button"
            onClick={onExit}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Play Again
          </button>
        </div>
      </section>
    );
  }

  if (!currentPhoto || !actual) {
    return null;
  }

  return (
    <section className="flex min-h-[80svh] flex-col gap-3 pb-[max(16px,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between rounded-2xl border border-muted/20 bg-surface/90 px-4 py-3">
        <div>
          <p className="text-xs text-muted">Solo Classic</p>
          <h2 className="text-lg font-bold">
            Round {roundIndex + 1}/{playable.length}
          </h2>
        </div>
        <div className="text-right">
          <p className="mono text-sm text-accent">{Math.ceil(elapsedMs / 1000)}s</p>
          <p className="mono text-xs text-muted">Streak: {streak}</p>
        </div>
      </header>

      <div className="surface overflow-hidden">
        <div className="relative h-[42svh] min-h-[240px] w-full bg-surfaceAlt">
          <img src={currentPhoto.url} alt={currentPhoto.name} className="h-full w-full object-cover" />
        </div>

        <div className="-mt-6 h-[48svh] min-h-[280px] px-3 pb-16">
          <MapGuesser guess={guess} actual={actual} showResult={showResult} onGuessChange={setGuess} />
        </div>
      </div>

      <div className="surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={useHint}
            disabled={hintUsed}
            className="rounded-full border border-muted/30 px-3 py-2 text-sm text-muted disabled:opacity-50"
          >
            {hintUsed ? 'Hint Used' : 'Use Hint'}
          </button>
          <span className="text-xs text-muted">Hint halves max score this round.</span>
        </div>

        {hintText ? <p className="mt-2 text-sm text-accent">Region: {hintText}</p> : null}

        <button
          type="button"
          onClick={showResult ? nextRound : submitGuess}
          disabled={!guess}
          className="mt-3 w-full rounded-full bg-primary px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-45"
        >
          {showResult ? (roundIndex + 1 === playable.length ? 'See Final Score' : 'Next Round') : 'Submit Guess'}
        </button>
      </div>

      {showResult && currentResult ? (
        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Round Result</p>
              <p className="mono mt-1 text-2xl text-accent">{currentResult.score.toLocaleString()} pts</p>
              <p className="mt-1 text-sm text-muted">
                {Math.round(currentResult.distanceKm)} km away - {currentResult.grade}
              </p>
            </div>
            <div className="text-right text-xs text-muted">
              <p>Base: {currentResult.base}</p>
              <p>Speed: +{currentResult.speedBonus}</p>
              <p>Streak x{currentResult.streakMultiplier.toFixed(1)}</p>
              <p>{currentResult.hintUsed ? 'Hint penalty applied' : 'No hint penalty'}</p>
            </div>
          </div>
        </motion.aside>
      ) : null}
    </section>
  );
}
