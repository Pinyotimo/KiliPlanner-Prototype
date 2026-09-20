# KiliPlanner Existing System Audit

Date: 2026-09-18

Scope: read-only audit of the current resident reporting flow, Supabase integration, database schema, and planner/official functionality. No reporting-system code was changed as part of this audit.

## Repository Structure

```text
src/
├── App.tsx                         # Top-level route selection and resident orchestration
├── components/                     # Shared UI, map, notifications, and loading components
│   ├── MapView.tsx                 # Leaflet map, boundary interaction, draft report pin
│   └── ui/                         # Shared primitive components
├── data/                           # Static geographic data
│   └── kilimaniBoundary.ts
├── features/
│   └── resident/
│       ├── analytics/              # Resident metrics calculations
│       ├── components/             # Report form, feed, filters, navigation, analytics UI
│       ├── hooks/                  # Issue loading, cache, filtering, realtime
│       └── lib/                    # Resident issue mutations and feed helpers
├── layouts/                        # Shared application layout
├── lib/                            # Supabase client, geocoding, geofence, storage helpers
├── admin/                          # Planner authentication, console, queries, analytics, reports
│   ├── components/
│   ├── lib/
│   ├── pages/
│   └── types/
├── officials/                      # Official workstation and status workflows
│   ├── components/
│   ├── lib/
│   ├── pages/
│   └── types/
├── types/                          # Shared issue and comment types
└── utils/                          # Geographic utilities
```

There are no dedicated `src/pages/`, `src/services/`, or `src/hooks/` directories. Service-like Supabase operations are distributed across feature `lib/` modules, admin/official query modules, and components. The main resident hook is under `src/features/resident/hooks/`.

## Capability Inventory

### Report form

Owner: `src/features/resident/components/ReportForm.tsx`

- Uses React Hook Form and Zod for browser-side validation.
- Supports category, description, sub-detail, address, reporter name/email, safety time, and an image.
- Compresses the image in the browser to JPEG base64 and sends it in the issue row.
- Creates or reuses a browser-local `kili_device_id`.
- Checks for a same-category open issue within 50 metres using the issues already loaded in the browser.
- Offers to endorse the nearby issue by directly updating `issues.upvotes`.
- Inserts directly into `issues`; there is no report service or server function between the form and Supabase.

Important mismatch: the form permits `security` and descriptions up to 500 characters, while the committed schema omits `security` and limits descriptions to 280 characters. The form also inserts fields not declared by the schema: `upvotes`, `is_security_alert`, `unsafe_time`, and `device_id`.

### Map component and geofence

Owner: `src/components/MapView.tsx`

- Uses React Leaflet and OpenStreetMap tiles.
- Displays issues and the Kilimani boundary.
- Allows a resident to click or drag a draft marker.
- Calls `isInsideKilimani` from `src/lib/boundaryCheck.ts` before accepting a location.
- Uses browser geolocation with high accuracy requested, but does not persist or enforce the returned accuracy value.

The boundary check is UX validation only. A caller can bypass it and submit arbitrary coordinates directly to Supabase.

### Supabase client

Owner: `src/lib/supabaseClient.ts`

The client is created with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The anonymous key is intentionally exposed to the browser, so all security must come from Supabase RLS, database constraints, RPCs, or trusted server-side functions. The client has no custom service layer or server credentials.

### Database schema

Owner: `sql/schema.sql`

The committed schema defines one primary table, `issues`, with category, description, status, coordinates, address, accuracy, reporter details, base64 photo, and creation time. It adds indexes for category, status, and creation time.

It enables RLS with:

- Public `SELECT` using `true`.
- Public `INSERT` with `check (true)`.
- No committed authenticated update/delete policies.
- Realtime publication for `issues`.

The schema does not define the frontend's expected `comments`, `issue_upvotes`, profiles/users, assignments, or expanded issue fields. It also does not define database-side geofence validation, rate limits, reputation, verification, audit events, or priority calculation.

### Authentication

Planner authentication is implemented with Supabase Auth in `src/admin/lib/plannerAccess.ts` and `src/admin/pages/PlannerLogin.tsx`. `PlannerConsole` hides the planner UI when there is no browser session.

Residents do not authenticate before reporting. The resident flow uses optional name/email and a browser-local UUID, neither of which is a trusted identity.

The route guard is not an authorization boundary. The database currently has no matching role-based RLS policies for planner or official writes.

### Storage buckets and photos

No Supabase Storage bucket is referenced in the repository. Photos are resized in the browser and stored as base64 in `issues.photo_base64`. This increases row size and makes the database the media store. The README lists moving photos to Supabase Storage as technical debt.

### Report table

The canonical report table is `public.issues`. Resident, planner, and official code all read it directly. Resident creation is a direct client insert. Planner and official status changes are direct client updates.

### User/profile table

No user or resident profile table is defined in `sql/schema.sql`, and no profile query was found in the inspected source. Supabase Auth sessions exist for planners, but there is no committed application profile/role model tied to `auth.users`.

### Admin and official functionality

Planner routes are selected in `src/App.tsx` and rendered by `src/admin/pages/PlannerConsole.tsx`:

- Dashboard
- Live map
- Issue management and issue details
- Analytics
- Notifications
- CSV reports/export
- Settings

Planner issue queries live in `src/admin/lib/adminQueries.ts`. The planner loads issues through the shared `useIssues` hook and performs most dashboard calculations in memory.

The official workstation is `src/officials/pages/OfficialDashboard.tsx`. Its query helper currently comments out the `assigned_to` filter and falls back to loading all issues when no assigned rows are returned. Status and official note updates are direct client updates. Official access is therefore not enforced by the database schema shown in this repository.

### Existing filters

Resident filters are in `src/features/resident/components/FilterBar.tsx` and are applied in memory by `useIssues`:

- Category, including `all`.
- Status: `all`, `open`, `in_progress`, `resolved`, and `closed`.

Planner issue filters support category, status, date range, search, sort, pagination, and page size in `src/admin/lib/adminQueries.ts`. Some planner queries are pushed to Supabase, but the planner console also keeps a full issue collection in the browser.

Official filters support all issues, security issues, or a selected status. Security items are sorted to the top in the browser.

### Existing statistics

Resident statistics are calculated by `src/features/resident/analytics/analyticsMetrics.ts` from the loaded issue array:

- Total issues
- Open, in-progress, resolved/closed counts
- Resolution rate
- Counts and resolution rates by category
- Category share percentages
- Recent issues

Planner statistics are similarly derived from loaded issue arrays in admin pages and `getAdminStats`. These are presentation calculations, not trusted reporting metrics.

### Existing realtime subscriptions

- `useIssues` subscribes to `INSERT`, `UPDATE`, and `DELETE` events for `public.issues` on `realtime-issues`.
- `OfficialDashboard` subscribes to issue `INSERT` and `UPDATE` events.
- `CommentSection` subscribes to comment changes, although `comments` is not in the committed schema.
- Local browser events such as `planner-issue-updated` synchronize status changes between views.
- Supabase realtime publication setup exists only for `issues` in `sql/schema.sql`.

Realtime rows are trusted by the clients and written into state/localStorage without an additional server-side trust decision.

## Current Dependency Map

```text
Resident navigation
    ↓
App.tsx
    ↓
MapView
    ↓
ReportForm
    ├── Zod / React Hook Form validation
    ├── reverseGeocode
    ├── browser-local duplicate scan
    ├── browser-local device ID
    └── direct supabase.from("issues").insert(...)
            ↓
        Supabase public client
            ↓
        public.issues
            ↓
        useIssues fetch + localStorage cache
            ↓
        issue realtime subscription
            ↓
        resident feed / map / analytics / planner / officials
```

The intended simplified path is therefore:

```text
Report Form
    ↓
direct issues insert (no report service currently exists)
    ↓
Supabase anon client
    ↓
public.issues
```

## Trust Engine Interception Point

The Trust Engine should intercept after the client has collected the report payload and before a report becomes a row in `public.issues`:

```text
Report Form
    ↓  untrusted payload only
Trusted server boundary
    ↓
Trust Engine
    ├── authenticated identity / resident identity state
    ├── server-side geofence validation
    ├── server-side coordinate and GPS accuracy validation
    ├── server-side rate limiting and abuse controls
    ├── server-side duplicate detection
    ├── server-side reputation calculation
    ├── server-side endorsement authorization and counting
    ├── server-side priority calculation
    ├── server-side security/verification decisions
    ├── content and media validation
    └── audit event creation
            ↓
        controlled insert/update or database RPC
            ↓
        public.issues and trust/audit tables
```

A Supabase Edge Function or narrowly scoped database RPC is the appropriate first trusted boundary. Direct client writes to `issues` should be removed or reduced to a policy that only the trusted function role can satisfy. RLS must remain the final authorization layer for reads and writes, including planner and official roles.

## Server-Side Enforcement Requirement

The frontend may provide hints and user feedback, but it must never be the source of truth for these fields or decisions:

| Trust concern         | Current client behavior                                         | Required authoritative enforcement                                 |
| --------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------ |
| Verification status   | No trusted implementation; UI can infer category/security state | Server/database-owned verification state and transition rules      |
| Resident reputation   | No trusted implementation; browser device ID only               | Auth-linked reputation ledger and server-calculated score          |
| Endorsement count     | Direct client update of`issues.upvotes`                       | One endorsement per authorized identity, server-side count/ledger  |
| Report priority       | Security items are sorted first in official UI                  | Server-calculated priority field and auditable rules               |
| Identity verification | Optional name/email and local UUID                              | Supabase Auth/profile verification and server-side identity checks |
| Admin privileges      | Planner session controls UI visibility                          | RLS roles/claims and server-side authorization                     |
| Geofence validation   | Turf polygon check in the browser                               | Database/RPC/Edge Function coordinate validation                   |
| Rate limits           | No enforcement found                                            | Server-side per-identity/device/IP limits with auditability        |

Additional trust-sensitive gaps found during the audit:

- Duplicate detection is based only on reports currently loaded in the browser.
- GPS accuracy is requested but not reliably captured or checked.
- `security` classification is client-selected.
- Status transitions and official notes are client-issued updates.
- Public insert policy currently allows arbitrary direct inserts.
- Public read policy exposes all issue rows, including reporter details and base64 photos.
- Realtime delivery is not a trust boundary; clients should treat incoming data as server output only after RLS and server workflows are correct.

## Recommended Boundary Sequence

1. Define the canonical schema and role/profile model, including trust and audit tables.
2. Implement a trusted report-submission function/RPC and move the insert behind it.
3. Enforce geofence, coordinate validity, accuracy, rate limits, duplicate checks, and priority server-side.
4. Add RLS policies for resident, planner, and official reads/writes; remove broad public mutation policies.
5. Replace direct endorsement updates with an authorized endorsement operation.
6. Move media to a private/controlled Storage bucket and store only validated object references in `issues`.
7. Keep browser validation and local filtering as responsiveness features, never as security controls.

## Authentication State Contract

The shared state model lives in `src/lib/authState.ts`:

```text
ANONYMOUS
OTP_PENDING
VERIFIED_RESIDENT
SUSPENDED
ADMIN
OFFICIAL
CONTRACTOR
```

These states are separate from `authenticationStatus`:

- `UNAUTHENTICATED` means there is no authenticated Supabase session.
- `AUTHENTICATED` means the user has an authenticated internal session.
- `publicIdentity` is `anonymous` for residents, including a `VERIFIED_RESIDENT` whose identity is intentionally hidden from the public.
- Staff states use `publicIdentity: staff` internally, but public issue views still receive no staff identity fields.

Role authorization must use server-controlled Supabase `app_metadata` or database/RLS claims. `user_metadata` and URL paths are not authorization sources.

## Configurable Report Categories

`report_categories` is the server-owned policy table for report types. It stores:

```text
requires_live_photo
requires_geofence
requires_verified_resident
requires_admin_review
minimum_corrobation
```

The trusted `submit-report` function reads this configuration for every submission. The browser category list is only a user-interface convenience and cannot relax the server policy. `requires_live_photo` requires valid uploaded image evidence and requests the device camera in supported browsers; a server cannot prove that an image was captured at the moment of submission without a dedicated capture/attestation service.
