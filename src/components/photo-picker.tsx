'use client';

import { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';

import { MAX_PHOTOS_PER_GAME } from '@/lib/constants';
import { clearSelectedPhotos, saveSelectedPhotos } from '@/lib/idb';
import { buildPhotoItem } from '@/lib/photo';
import type { PhotoItem } from '@/types/game';

interface PhotoPickerProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
}

export function PhotoPicker({ photos, onPhotosChange }: PhotoPickerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInferring, setIsInferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gpsCount = useMemo(() => photos.filter((photo) => Boolean(photo.gps)).length, [photos]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const unique = new Map<string, PhotoItem>();
      const fileLookup = new Map<string, File>();
      const limitedFiles = Array.from(files).slice(0, MAX_PHOTOS_PER_GAME);

      const parsed = await Promise.all(
        limitedFiles.map(async (file) => {
          const item = await buildPhotoItem(file, nanoid(10));
          fileLookup.set(item.id, file);
          return item;
        })
      );

      for (const item of parsed) {
        if (!unique.has(item.hash)) {
          unique.set(item.hash, item);
        }
      }

      const prepared = Array.from(unique.values()).slice(0, MAX_PHOTOS_PER_GAME);
      await saveSelectedPhotos(prepared, fileLookup);
      onPhotosChange(prepared);
    } catch {
      setError('Failed to process selected photos. Try a smaller set or different format.');
    } finally {
      setIsProcessing(false);
    }
  }

  async function inferMissingGps() {
    const missing = photos.filter((photo) => !photo.gps);
    if (!missing.length) {
      return;
    }

    setIsInferring(true);
    setError(null);

    try {
      const updates = await Promise.all(
        missing.map(async (photo) => {
          const response = await fetch('/api/ai/locate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: photo.name })
          });

          if (!response.ok) {
            return photo;
          }

          const json = (await response.json()) as {
            region?: string;
            lat?: number;
            lon?: number;
          };

          if (typeof json.lat !== 'number' || typeof json.lon !== 'number') {
            return photo;
          }

          return {
            ...photo,
            gps: { lat: json.lat, lon: json.lon },
            inferredRegion: json.region
          };
        })
      );

      const byId = new Map(photos.map((photo) => [photo.id, photo]));
      for (const updated of updates) {
        byId.set(updated.id, updated);
      }

      onPhotosChange(Array.from(byId.values()));
    } catch {
      setError('AI fallback unavailable right now.');
    } finally {
      setIsInferring(false);
    }
  }

  async function clearSelection() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url));
    onPhotosChange([]);
    await clearSelectedPhotos();
  }

  return (
    <section className="surface noise-overlay p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Pick Photos</h2>
          <p className="text-sm text-muted">Select up to 20 camera roll photos. Nothing gets uploaded.</p>
        </div>
        <span className="mono rounded-full bg-surfaceAlt px-3 py-1 text-xs text-muted">
          GPS ready: {gpsCount}/{photos.length}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="inline-flex cursor-pointer items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
          {isProcessing ? 'Reading Photos...' : 'Choose Photos'}
          <input
            hidden
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </label>

        <button
          type="button"
          onClick={() => void inferMissingGps()}
          disabled={isInferring || photos.every((photo) => photo.gps)}
          className="rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isInferring ? 'Inferring...' : 'Infer Missing GPS'}
        </button>

        <button
          type="button"
          onClick={() => void clearSelection()}
          disabled={!photos.length}
          className="rounded-full border border-muted/40 bg-surfaceAlt px-4 py-2 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-45"
        >
          Clear
        </button>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
        {photos.map((photo) => (
          <article key={photo.id} className="overflow-hidden rounded-xl border border-muted/20 bg-surfaceAlt">
            <div className="relative aspect-square w-full">
              <img src={photo.url} alt={photo.name} className="h-full w-full object-cover" />
              <span
                className={`absolute right-2 top-2 h-3 w-3 rounded-full ${photo.gps ? 'bg-emerald-400' : 'bg-rose-400'}`}
                title={photo.gps ? 'GPS metadata found' : 'GPS metadata missing'}
              />
            </div>
            <div className="p-2">
              <p className="truncate text-xs text-muted">{photo.name}</p>
              {photo.inferredRegion ? (
                <p className="mt-1 truncate text-[11px] text-accent">{photo.inferredRegion}</p>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {!photos.length ? (
        <p className="mt-4 text-sm text-muted">
          Tip: Select original camera photos for best GPS hit rate. Social app exports often strip metadata.
        </p>
      ) : null}
    </section>
  );
}
