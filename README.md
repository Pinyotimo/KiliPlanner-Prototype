# KiliPlanner

KiliPlanner is a civic infrastructure reporting platform for Kilimani Ward. It lets residents report local issues, view community reports in real time, and gives planners or officials a workspace for monitoring, filtering, exporting, and updating issue progress.

## Current Status

The project has moved beyond the original scaffold. The resident reporting flow, map, feed, analytics, planner console, and officials dashboard are now implemented in the frontend.

At the moment, the app supports these issue categories:

- Water
- Sewage
- Waste
- Environmental pollution
- Road damage
- Encroachment on infrastructure
- Other

## Built Features

Resident-facing app:

- Leaflet/OpenStreetMap map centered on Kilimani
- Kilimani boundary polygon and client-side boundary validation
- Report issue flow from map click
- Category selection, description, optional sub-location, reporter name/email, and photo attachment
- Reverse geocoding for detected addresses
- Image compression before upload
- Community issue feed
- Category and status filters
- Issue cards with status, category, location, timestamp, photo, reporter info, comments, and endorsements
- Nearby duplicate detection with an option to endorse an existing report
- Realtime issue updates from Supabase
- Realtime comments per issue
- Analytics/stats panel
- About page

Planner console at `/planner`:

- Supabase auth-based planner login
- Dashboard with report totals and summaries
- Live infrastructure map
- Issue list and search
- Issue detail pages
- Basic status updates
- Analytics page with report trends, category counts, status counts, and hotspots
- CSV export
- Local planner settings
- Realtime/manual refresh option
- New report notifications

Officials dashboard at `/officials`:

- Assigned issue view with fallback to all issues
- Status filtering
- Status counts
- Issue cards
- Status and official notes update flow

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project at https://supabase.com.

3. Run the database schema:

   Open the SQL Editor in Supabase and run the contents of `sql/schema.sql`.

   If the project already has the schema, run
   `sql/migrations/20260919_add_second_evidence_angle.sql` before submitting
   reports with two evidence angles.

4. Enable Realtime:

   In Supabase, enable Realtime for the `issues` table under Database replication settings.

5. Configure environment variables:

   ```bash
   cp .env.example .env
   ```

   Then fill in:

   ```bash
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```

6. Run the app:

   ```bash
   npm run dev
   ```

   The app opens at http://localhost:5173.

### Grant planner access

Planner access requires a Supabase Auth user with the server-controlled
`app_metadata.role` claim set to `admin`. Create the user under
Authentication → Users, then run this in the Supabase SQL Editor, replacing
the email with the planner account email:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
   || jsonb_build_object('role', 'admin')
where email = 'planner@example.com';
```

Sign out of the app and sign in again after changing the role so the session
JWT contains the new claim. Do not put this update in frontend code or expose
a service-role key to the browser.

## Available Routes

- `/` - resident feed, map, report form, filters, analytics, and about page
- `/planner` - planner/admin console
- `/planner/map` - planner live map
- `/planner/issues` - planner issue management
- `/planner/issues/:id` - planner issue details
- `/planner/analytics` - planner analytics
- `/planner/reports` - CSV export
- `/planner/settings` - planner preferences
- `/officials` - official workstation

## Database Notes

The frontend currently expects more fields and tables than the committed SQL schema defines.

The current `sql/schema.sql` includes the core `issues` table with:

- category
- description
- status
- latitude/longitude
- address
- reporter details
- base64 photo storage
- created timestamp
- public read and insert RLS policies

The app also expects newer capabilities that should be added to the schema:

- `upvotes` on `issues`
- `issue_upvotes` table
- `comments` table
- `assigned_to`
- `official_notes`
- `updated_at`
- extra statuses such as `in_progress` and `closed`
- planner/official update policies

## Recommended Next Steps

1. Update `sql/schema.sql` to match the current frontend features.
2. Add proper RLS policies for comments, upvotes, planner updates, and official updates.
3. Move photos from base64 database storage to Supabase Storage.
4. Add assignment and department workflows.
5. Add resolution timestamps for response-time analytics.
6. Replace or verify the Kilimani boundary with the final official ward boundary if needed.
7. Add tests for report submission, filtering, status updates, and schema-dependent flows.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
