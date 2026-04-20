'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { loadSelectedPhotos } from '@/lib/idb';
import type { PhotoItem } from '@/types/game';
import { MultiplayerHub } from '@/components/multiplayer-hub';
import { PhotoPicker } from '@/components/photo-picker';
import { SoloGame } from '@/components/solo-game';

type ViewState = 'home' | 'soloSetup' | 'soloPlaying' | 'multiplayer';

export function GeoSnapApp() {
  const [view, setView] = useState<ViewState>('home');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  const gpsReadyCount = useMemo(() => photos.filter((photo) => photo.gps).length, [photos]);

  useEffect(() => {
    loadSelectedPhotos()
      .then((cached) => {
        if (cached.length) {
          setPhotos(cached);
        }
      })
      .catch(() => {
        // IndexedDB may be unavailable in private mode.
      });
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <header className="surface noise-overlay overflow-hidden p-6 sm:p-8">
        <p className="mono text-xs uppercase tracking-[0.18em] text-accent">GeoSnap PWA</p>
        <h1 className="mt-2 text-4xl font-black leading-tight sm:text-5xl">
          GeoGuessr with
          <span className="block text-primary">your own camera roll.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted sm:text-base">
          Drop a pin on a real map, reveal where your memory was actually captured, and compete with friends in real-time lobbies.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView('soloSetup')}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white"
          >
            Play with My Photos
          </button>
          <button
            type="button"
            onClick={() => setView('multiplayer')}
            className="rounded-full border border-accent/35 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent"
          >
            Play with Friends
          </button>
          <Link
            href="/lobby/DAILY1"
            className="rounded-full border border-muted/35 px-5 py-2.5 text-sm font-semibold text-muted"
          >
            Daily Challenge Lobby
          </Link>
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="surface p-4">
          <p className="text-xs text-muted">Selected photos</p>
          <p className="mono mt-1 text-2xl text-accent">{photos.length}</p>
        </article>
        <article className="surface p-4">
          <p className="text-xs text-muted">GPS-ready rounds</p>
          <p className="mono mt-1 text-2xl text-accent">{gpsReadyCount}</p>
        </article>
        <article className="surface p-4">
          <p className="text-xs text-muted">Privacy mode</p>
          <p className="mt-1 text-sm font-semibold">Photos remain on your device</p>
        </article>
      </section>

      <div className="mt-6">
        {view === 'home' ? (
          <PhotoPicker photos={photos} onPhotosChange={setPhotos} />
        ) : null}

        {view === 'soloSetup' ? (
          <section className="space-y-4">
            <PhotoPicker photos={photos} onPhotosChange={setPhotos} />
            <div className="surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted">Ready when you are. You need at least one GPS-ready photo.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setView('home')}
                    className="rounded-full border border-muted/30 px-4 py-2 text-sm text-muted"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('soloPlaying')}
                    disabled={gpsReadyCount < 1}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Start Solo Game
                  </button>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {view === 'soloPlaying' ? <SoloGame photos={photos} onExit={() => setView('soloSetup')} /> : null}

        {view === 'multiplayer' ? (
          <section className="space-y-4">
            <PhotoPicker photos={photos} onPhotosChange={setPhotos} />
            <MultiplayerHub photos={photos} />
            <button
              type="button"
              onClick={() => setView('home')}
              className="rounded-full border border-muted/30 px-4 py-2 text-sm text-muted"
            >
              Back Home
            </button>
          </section>
        ) : null}
      </div>
    </main>
  );
}
