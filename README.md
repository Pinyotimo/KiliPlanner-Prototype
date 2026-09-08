# KiliPlanner — Prototype Scaffold

Working skeleton: map loads → Kilimani boundary drawn → click inside the
boundary is accepted (click outside is rejected with a message) → existing
issues load from Supabase and render as colored pins → new inserts appear
live via Realtime. The actual report submission form is not built yet
(see `App.tsx`'s `handleValidClick` — that's the next piece to add).

## Setup

1. **Install dependencies**
   ```
   npm install
   ```

2. **Create a Supabase project** at https://supabase.com (free tier is fine).

3. **Run the schema**: open the SQL Editor in your Supabase project and run
   the contents of `sql/schema.sql`. Also confirm Realtime is enabled for
   the `issues` table under Database → Replication.

4. **Set environment variables**:
   ```
   cp .env.example .env
   ```
   Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from
   Project Settings → API in the Supabase dashboard.

5. **Replace the placeholder boundary**: `src/data/kilimaniBoundary.ts`
   currently has a rough rectangle, not the real Kilimani Ward outline.
   Trace the real one at https://geojson.io and paste the coordinates in —
   see the comment at the top of that file for the exact steps.

6. **Run it**:
   ```
   npm run dev
   ```
   Opens at http://localhost:5173.

## What's here vs. what's next

Built:
- Vite + React + TypeScript project structure
- Leaflet map centered on Kilimani with the boundary polygon drawn
- Client-side boundary check (Turf.js) on map click — accepts/rejects
  before anything touches the backend
- Supabase client, schema, and RLS policies (`sql/schema.sql`)
- Fetch existing issues + live Realtime subscription for new ones
- Colored pins per category

Not built yet (see SRS §3.3 for the full spec):
- The actual report submission form (category select, description,
  optional photo/name/email)
- Reverse geocoding on submit (Nominatim)
- Category/status filter bar
- Stats dashboard (Chart.js)

`App.tsx`'s `handleValidClick` is where the report form should hook in next
— it already receives a validated (lat, lng).
