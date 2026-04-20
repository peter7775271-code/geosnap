import { openDB } from 'idb';

import type { LatLng, PhotoItem } from '@/types/game';

const DB_NAME = 'geosnap-db';
const STORE_NAME = 'photos';
const STORE_KEY = 'latest-selection';

interface StoredPhoto {
  id: string;
  name: string;
  hash: string;
  fileType: string;
  size: number;
  gps: LatLng | null;
  inferredRegion?: string;
  blob: Blob;
}

interface StoredPayload {
  createdAt: string;
  photos: StoredPhoto[];
}

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    }
  });
}

export async function saveSelectedPhotos(
  photos: PhotoItem[],
  fileLookup: Map<string, File>
): Promise<void> {
  const db = await getDb();
  const data: StoredPayload = {
    createdAt: new Date().toISOString(),
    photos: await Promise.all(
      photos.map(async (photo) => {
        const file = fileLookup.get(photo.id);
        if (!file) {
          throw new Error(`Missing file for photo ${photo.id}`);
        }

        return {
          id: photo.id,
          name: photo.name,
          hash: photo.hash,
          fileType: photo.fileType,
          size: photo.size,
          gps: photo.gps,
          inferredRegion: photo.inferredRegion,
          blob: file
        };
      })
    )
  };

  await db.put(STORE_NAME, data, STORE_KEY);
}

export async function loadSelectedPhotos(): Promise<PhotoItem[]> {
  const db = await getDb();
  const payload = (await db.get(STORE_NAME, STORE_KEY)) as StoredPayload | undefined;
  if (!payload?.photos?.length) {
    return [];
  }

  return payload.photos.map((stored) => ({
    id: stored.id,
    name: stored.name,
    hash: stored.hash,
    fileType: stored.fileType,
    size: stored.size,
    gps: stored.gps,
    inferredRegion: stored.inferredRegion,
    url: URL.createObjectURL(stored.blob)
  }));
}

export async function clearSelectedPhotos(): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, STORE_KEY);
}
