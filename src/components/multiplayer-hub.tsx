'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { nanoid } from 'nanoid';

import type { PhotoItem } from '@/types/game';

interface MultiplayerHubProps {
  photos: PhotoItem[];
}

const USER_STORAGE_KEY = 'geosnap-user-id';

export function MultiplayerHub({ photos }: MultiplayerHubProps) {
  const playable = useMemo(() => photos.filter((photo) => photo.gps), [photos]);

  const [userId, setUserId] = useState('');
  const [roundCount, setRoundCount] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const existing = localStorage.getItem(USER_STORAGE_KEY);
    if (existing) {
      setUserId(existing);
      return;
    }

    const generated = `guest_${nanoid(8)}`;
    localStorage.setItem(USER_STORAGE_KEY, generated);
    setUserId(generated);
  }, []);

  async function createLobby() {
    if (!playable.length || !userId) {
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostUserId: userId,
          mode: 'multiplayer',
          roundCount,
          timerSeconds: timerSeconds > 0 ? timerSeconds : null,
          rounds: playable.slice(0, roundCount).map((photo) => ({
            photoHash: photo.hash,
            actualLat: photo.gps?.lat,
            actualLon: photo.gps?.lon
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Could not create lobby');
      }

      const json = (await response.json()) as {
        joinCode: string;
      };

      setCreatedCode(json.joinCode);
    } catch {
      setError('Failed to create lobby.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="surface p-5 sm:p-6">
      <h2 className="text-2xl font-black">Multiplayer Battle</h2>
      <p className="mt-1 text-sm text-muted">Create a 6-character lobby code and play with up to 6 friends.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm text-muted">
          Rounds
          <input
            type="number"
            min={1}
            max={Math.min(20, playable.length || 20)}
            value={roundCount}
            onChange={(event) => setRoundCount(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
            className="mt-1 w-full rounded-lg border border-muted/30 bg-surfaceAlt px-3 py-2 text-text"
          />
        </label>

        <label className="text-sm text-muted">
          Timer (seconds)
          <select
            value={String(timerSeconds)}
            onChange={(event) => setTimerSeconds(Number(event.target.value))}
            className="mt-1 w-full rounded-lg border border-muted/30 bg-surfaceAlt px-3 py-2 text-text"
          >
            <option value="30">30</option>
            <option value="60">60</option>
            <option value="120">120</option>
            <option value="0">No limit</option>
          </select>
        </label>

        <div className="rounded-lg border border-muted/20 bg-surfaceAlt px-3 py-2">
          <p className="text-xs text-muted">GPS-ready host photos</p>
          <p className="mono mt-1 text-xl text-accent">{playable.length}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void createLobby()}
        disabled={isCreating || playable.length < 1}
        className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {isCreating ? 'Creating Lobby...' : 'Create Lobby'}
      </button>

      {createdCode ? (
        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 p-4">
          <p className="text-sm text-muted">Lobby code</p>
          <p className="mono mt-1 text-3xl tracking-widest text-accent">{createdCode}</p>
          <div className="mt-3 flex gap-2">
            <Link
              href={`/lobby/${createdCode}`}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Open Lobby
            </Link>
            <button
              type="button"
              onClick={() => {
                const text = `Join my GeoSnap lobby with code ${createdCode}`;
                if (navigator.share) {
                  void navigator.share({ title: 'GeoSnap Lobby', text });
                } else {
                  void navigator.clipboard.writeText(text);
                }
              }}
              className="rounded-full border border-muted/30 px-4 py-2 text-sm text-muted"
            >
              Share Code
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 rounded-xl border border-muted/20 bg-surfaceAlt p-4">
        <p className="text-sm font-semibold">Join Existing Lobby</p>
        <div className="mt-2 flex gap-2">
          <input
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
            placeholder="6-character code"
            className="mono w-full rounded-lg border border-muted/30 bg-surface px-3 py-2 text-sm tracking-widest text-text"
          />
          <Link
            href={joinCode.trim().length >= 6 ? `/lobby/${joinCode.trim()}` : '#'}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Join
          </Link>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </section>
  );
}
