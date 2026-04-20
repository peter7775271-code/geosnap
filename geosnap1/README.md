# GeoSnap

GeoSnap is a mobile-first PWA that turns your own camera roll into a GeoGuessr-style game.

## Built from the PRD

This implementation includes:

- Solo Classic loop: photo -> map guess -> distance + score -> final summary
- Client-side EXIF GPS extraction for selected photos
- GPS fallback inference endpoint for photos without metadata
- Google Maps guessing interface with draggable pin, zoom-to-guess, and result line
- Haversine scoring with speed bonus, streak multiplier, and hint penalty
- Multiplayer lobby flow with 6-character join codes
- API routes for sessions, joining, guessing, daily challenge, and score sharing
- PWA setup: manifest, service worker registration, offline cache seed
- IndexedDB persistence for selected photos between reloads

## Stack

- Next.js 14 (App Router, TypeScript)
- Tailwind CSS
- exifr
- @googlemaps/js-api-loader
- Supabase client wiring (optional env setup)

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env.local
```

3. Add at least:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for full map interaction

Optional:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`

4. Run development server:

```bash
npm run dev
```

## API Overview

- `POST /api/sessions`
- `GET /api/sessions/:code`
- `PATCH /api/sessions/:id`
- `POST /api/sessions/:id/join`
- `POST /api/rounds/:id/guess`
- `GET /api/daily`
- `POST /api/scores/share`

## Notes

- In this codebase, session state is stored in an in-memory server store for local development.
- `supabase/schema.sql` contains a production-ready starting schema.
- If no Google Maps API key is set, the app falls back to manual coordinate inputs for guesses.
