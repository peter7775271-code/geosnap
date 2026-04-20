import * as exifr from 'exifr';

import type { LatLng, PhotoItem } from '@/types/game';

const AVG_HASH_SIZE = 8;

function toHexHash(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function digestString(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHexHash(hash).slice(0, 24);
}

async function averageHash(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = AVG_HASH_SIZE;
    canvas.height = AVG_HASH_SIZE;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas context unavailable');
    }

    context.drawImage(bitmap, 0, 0, AVG_HASH_SIZE, AVG_HASH_SIZE);
    const { data } = context.getImageData(0, 0, AVG_HASH_SIZE, AVG_HASH_SIZE);

    const pixels: number[] = [];
    for (let index = 0; index < data.length; index += 4) {
      const average = Math.round((data[index] + data[index + 1] + data[index + 2]) / 3);
      pixels.push(average);
    }

    const threshold = pixels.reduce((sum, value) => sum + value, 0) / pixels.length;
    const bits = pixels.map((pixel) => (pixel >= threshold ? '1' : '0')).join('');

    bitmap.close();
    return bits;
  } catch {
    return digestString(`${file.name}:${file.size}:${file.lastModified}`);
  }
}

export async function extractGps(file: File): Promise<LatLng | null> {
  try {
    const gps = await exifr.gps(file);
    if (!gps || typeof gps.latitude !== 'number' || typeof gps.longitude !== 'number') {
      return null;
    }

    return {
      lat: gps.latitude,
      lon: gps.longitude
    };
  } catch {
    return null;
  }
}

export async function buildPhotoItem(file: File, id: string): Promise<PhotoItem> {
  const gps = await extractGps(file);
  const hash = await averageHash(file);

  return {
    id,
    name: file.name,
    url: URL.createObjectURL(file),
    hash,
    fileType: file.type || 'image/*',
    size: file.size,
    gps
  };
}
