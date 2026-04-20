'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';

import type { GameSession, LeaderboardEntry } from '@/types/game';

const USER_STORAGE_KEY = 'geosnap-user-id';

interface LobbyRoomProps {
  code: string;
}

export function LobbyRoom({ code }: LobbyRoomProps) {
  const [userId, setUserId] = useState('');
  const [session, setSession] = useState<GameSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const joinedRef = useRef<string | null>(null);

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

  useEffect(() => {
    let stopped = false;

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${code.toUpperCase()}`, {
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error('Session not found');
        }

        const json = (await response.json()) as {
          session: GameSession;
          leaderboard: LeaderboardEntry[];
        };

        if (stopped) {
          return;
        }

        setSession(json.session);
        setLeaderboard(json.leaderboard);
        setError(null);

        if (userId && joinedRef.current !== json.session.id) {
          const joinResponse = await fetch(`/api/sessions/${json.session.id}/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
          });

          if (joinResponse.ok) {
            joinedRef.current = json.session.id;
          }
        }
      } catch {
        if (!stopped) {
          setError('Unable to load this lobby.');
        }
      }
    };

    void fetchSession();
    const interval = window.setInterval(() => {
      void fetchSession();
    }, 2000);

    return () => {
      stopped = true;
      window.clearInterval(interval);
    };
  }, [code, userId]);

  const isHost = useMemo(() => session?.hostUserId === userId, [session?.hostUserId, userId]);

  async function updateStatus(status: 'waiting' | 'active' | 'finished') {
    if (!session) {
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error('Failed status update');
      }

      const json = (await response.json()) as { session: GameSession };
      setSession(json.session);
    } catch {
      setError('Failed to update session state.');
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-12 pt-6 sm:px-6">
      <section className="surface p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wide text-muted">Multiplayer Lobby</p>
        <h1 className="mt-1 text-3xl font-black">Code: {code.toUpperCase()}</h1>

        {session ? (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-muted/20 bg-surfaceAlt p-3">
                <p className="text-xs text-muted">Status</p>
                <p className="mt-1 text-sm font-semibold capitalize">{session.status}</p>
              </div>
              <div className="rounded-xl border border-muted/20 bg-surfaceAlt p-3">
                <p className="text-xs text-muted">Players</p>
                <p className="mono mt-1 text-xl text-accent">{session.players.length}</p>
              </div>
              <div className="rounded-xl border border-muted/20 bg-surfaceAlt p-3">
                <p className="text-xs text-muted">Rounds</p>
                <p className="mono mt-1 text-xl text-accent">{session.roundCount}</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-muted/20 bg-surfaceAlt p-4">
              <p className="text-sm font-semibold">Players in Lobby</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {session.players.map((player) => (
                  <span key={player} className="mono rounded-full bg-surface px-3 py-1 text-xs text-muted">
                    {player}
                  </span>
                ))}
              </div>
            </div>

            {isHost ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void updateStatus('active')}
                  disabled={isUpdating}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  Start Game
                </button>
                <button
                  type="button"
                  onClick={() => void updateStatus('finished')}
                  disabled={isUpdating}
                  className="rounded-full border border-muted/30 px-4 py-2 text-sm text-muted"
                >
                  End Game
                </button>
              </div>
            ) : null}

            <div className="mt-4 rounded-xl border border-muted/20 bg-surfaceAlt p-4">
              <p className="text-sm font-semibold">Live Leaderboard</p>
              {leaderboard.length ? (
                <div className="mt-3 space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between rounded-lg border border-muted/20 bg-surface px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          {index + 1}. {entry.userId}
                        </p>
                        <p className="text-xs text-muted">{Math.round(entry.averageDistanceKm)} km avg</p>
                      </div>
                      <p className="mono text-sm text-accent">{entry.totalScore.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">No guesses submitted yet.</p>
              )}
            </div>
          </>
        ) : (
          <p className="mt-4 text-sm text-muted">Loading lobby...</p>
        )}

        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
      </section>
    </main>
  );
}
