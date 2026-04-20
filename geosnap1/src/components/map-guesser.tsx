'use client';

import { Loader } from '@googlemaps/js-api-loader';
import { useEffect, useMemo, useRef, useState } from 'react';

import { clampLat, clampLon } from '@/lib/geo';
import { DARK_MAP_STYLE } from '@/lib/maps-style';
import type { LatLng } from '@/types/game';

interface MapGuesserProps {
  guess: LatLng | null;
  actual: LatLng | null;
  showResult: boolean;
  onGuessChange: (guess: LatLng | null) => void;
}

export function MapGuesser({ guess, actual, showResult, onGuessChange }: MapGuesserProps) {
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const guessMarkerRef = useRef<google.maps.Marker | null>(null);
  const actualMarkerRef = useRef<google.maps.Marker | null>(null);
  const lineRef = useRef<google.maps.Polyline | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [fallbackGuess, setFallbackGuess] = useState<LatLng>(
    guess ?? {
      lat: 0,
      lon: 0
    }
  );

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!googleMapsApiKey || !mapNodeRef.current || mapRef.current) {
      return;
    }

    const loader = new Loader({
      apiKey: googleMapsApiKey,
      version: 'weekly'
    });

    let mounted = true;

    loader
      .load()
      .then(() => {
        if (!mounted || !mapNodeRef.current) {
          return;
        }

        const map = new google.maps.Map(mapNodeRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          styles: DARK_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy'
        });

        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          const lat = event.latLng?.lat();
          const lon = event.latLng?.lng();
          if (typeof lat !== 'number' || typeof lon !== 'number') {
            return;
          }

          onGuessChange({ lat, lon });
          if (navigator.vibrate) {
            navigator.vibrate(12);
          }
        });

        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => {
        setMapReady(false);
      });

    return () => {
      mounted = false;
    };
  }, [googleMapsApiKey, onGuessChange]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current;

    if (!guess) {
      if (guessMarkerRef.current) {
        guessMarkerRef.current.setMap(null);
        guessMarkerRef.current = null;
      }
      return;
    }

    const position = new google.maps.LatLng(guess.lat, guess.lon);

    if (!guessMarkerRef.current) {
      guessMarkerRef.current = new google.maps.Marker({
        map,
        position,
        draggable: true,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#E8FF47',
          fillOpacity: 1,
          strokeColor: '#0A0A0F',
          strokeWeight: 2,
          scale: 9
        }
      });

      guessMarkerRef.current.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        const lat = event.latLng?.lat();
        const lon = event.latLng?.lng();
        if (typeof lat !== 'number' || typeof lon !== 'number') {
          return;
        }

        onGuessChange({ lat, lon });
      });
    } else {
      guessMarkerRef.current.setPosition(position);
    }

    if (!showResult) {
      map.panTo(position);
    }
  }, [guess, mapReady, onGuessChange, showResult]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }

    const map = mapRef.current;

    if (lineRef.current) {
      lineRef.current.setMap(null);
      lineRef.current = null;
    }

    if (actualMarkerRef.current) {
      actualMarkerRef.current.setMap(null);
      actualMarkerRef.current = null;
    }

    if (!showResult || !guess || !actual) {
      return;
    }

    const actualPosition = { lat: actual.lat, lng: actual.lon };

    actualMarkerRef.current = new google.maps.Marker({
      map,
      position: actualPosition,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#1A73E8',
        fillOpacity: 1,
        strokeColor: '#EAF1FF',
        strokeWeight: 2,
        scale: 8
      }
    });

    lineRef.current = new google.maps.Polyline({
      map,
      path: [
        { lat: guess.lat, lng: guess.lon },
        { lat: actual.lat, lng: actual.lon }
      ],
      geodesic: true,
      strokeColor: '#E8FF47',
      strokeOpacity: 0.95,
      strokeWeight: 2
    });

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: guess.lat, lng: guess.lon });
    bounds.extend(actualPosition);
    map.fitBounds(bounds, 60);
  }, [actual, guess, mapReady, showResult]);

  const hasGoogleMaps = useMemo(() => Boolean(googleMapsApiKey), [googleMapsApiKey]);

  if (!hasGoogleMaps) {
    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-muted/20 bg-surface p-4">
        <div>
          <h3 className="text-lg font-semibold">Map Fallback Mode</h3>
          <p className="mt-1 text-sm text-muted">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for full map interaction. You can still play by setting coordinates manually.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-muted">
            Latitude
            <input
              type="number"
              min={-90}
              max={90}
              step={0.0001}
              value={fallbackGuess.lat}
              onChange={(event) =>
                setFallbackGuess((prev) => ({
                  ...prev,
                  lat: clampLat(Number(event.target.value))
                }))
              }
              className="mt-1 w-full rounded-lg border border-muted/30 bg-surfaceAlt px-3 py-2 text-text"
            />
          </label>

          <label className="text-sm text-muted">
            Longitude
            <input
              type="number"
              min={-180}
              max={180}
              step={0.0001}
              value={fallbackGuess.lon}
              onChange={(event) =>
                setFallbackGuess((prev) => ({
                  ...prev,
                  lon: clampLon(Number(event.target.value))
                }))
              }
              className="mt-1 w-full rounded-lg border border-muted/30 bg-surfaceAlt px-3 py-2 text-text"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => onGuessChange(fallbackGuess)}
          className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Set Guess Coordinates
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-muted/20">
      <div ref={mapNodeRef} className="h-full w-full" />
      {guess ? (
        <button
          type="button"
          onClick={() => {
            if (!mapRef.current || !guess) {
              return;
            }

            mapRef.current.panTo({ lat: guess.lat, lng: guess.lon });
            mapRef.current.setZoom(Math.max(mapRef.current.getZoom() ?? 2, 5));
          }}
          className="absolute left-3 top-3 rounded-full border border-primary/30 bg-primary/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
        >
          Zoom to Guess
        </button>
      ) : null}
    </div>
  );
}
