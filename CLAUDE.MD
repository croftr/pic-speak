# Pic Speak - Project Overview

## What This Project Is

Pic Speak is a communication board builder designed to help non-verbal children communicate using customizable picture cards with audio support. The application allows parents and caregivers to create personalized communication boards using real photos and familiar voices.

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **UI**: React 19.2.3
- **Styling**: Tailwind CSS v4
- **Authentication**: Clerk
- **AI**: Google Generative AI (@google/genai)
- **Icons**: Lucide React
- **Runtime**: Node.js

## Project Structure

```
migrations/                  # Versioned SQL migration files (NNN_name.sql)
scripts/
└── run-migrations.ts        # Migration runner (npm run db:migrate)
schema.sql                   # Full schema reference (not used by runner)
src/
├── app/
│   ├── api/
│   │   ├── boards/          # Board CRUD operations
│   │   │   ├── route.ts     # GET all boards, POST new board
│   │   │   └── [id]/route.ts # GET/DELETE specific board
│   │   ├── cards/           # Card CRUD operations
│   │   │   ├── route.ts     # GET all cards, POST new card
│   │   │   └── [id]/route.ts # GET/DELETE specific card
│   │   ├── upload/route.ts  # File upload endpoint
│   │   └── generate-image/route.ts # AI image generation
│   ├── board/[id]/page.tsx  # Individual board view
│   ├── my-boards/page.tsx   # User's boards list
│   ├── page.tsx             # Landing page
│   └── layout.tsx           # Root layout with Clerk
├── components/
│   ├── AddCardModal.tsx     # Modal for creating cards
│   ├── AudioRecorder.tsx    # Audio recording component
│   └── CommunicationCard.tsx         # Individual communication card display
├── lib/
│   └── storage.ts           # Data storage utilities
├── types/
│   └── index.ts             # TypeScript type definitions
└── proxy.ts                 # Clerk authentication proxy (Next.js middleware)

```

## Core Features

### 1. Board Management
- Create multiple communication boards
- Each board has a name and optional description
- User-specific boards tied to Clerk authentication
- View all boards at `/my-boards`

### 2. Card System
- Upload custom images or generate with AI
- Record audio or upload audio files
- Label each card
- Optional background color customization
- Cards are organized within boards

### 3. Audio Capabilities
- Record voice directly in the browser
- Upload pre-recorded audio files
- Play audio when cards are tapped

### 4. AI Features
- Google Generative AI integration for image generation
- Generate custom images for cards when photos aren't available

## Key Data Models

See `src/types/index.ts` for all type definitions. Key models: `Board`, `Card`, `BoardLike`, `BoardComment`.

## Authentication

- Clerk is used for user authentication
- Protected routes use proxy.ts
- SignIn/SignUp available on landing page
- User-specific data isolation via userId

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Testing

`npm run test:all` runs everything CI runs: the Playwright suite, then a production build, then the three script tests. Two layers of end-to-end tests, both run in CI (`.github/workflows/e2e.yml`) on every push/PR to main:

- **Playwright suite** (`e2e/*.spec.ts`, `npm run test:e2e`): signed-in user journeys (board/card CRUD, settings, search/filter, public boards, card picker) plus request-level API tests (`api-security.spec.ts` for authorization, `card-reorder.spec.ts` for reorder persistence). `e2e/global.setup.ts` signs in once via Clerk and saves storage state to `e2e/.auth/user.json` — individual tests never sign in themselves; they call `useSignedInSession(page)` from `e2e/helpers.ts`. Global setup also cleans up orphaned test boards, strictly scoped to the test user's `user_id`. Locally the suite loads secrets from `.env.local` (needs `E2E_CLERK_USER_USERNAME`) and reuses a running dev server; in CI it runs against the production build.
- **Script tests** (`scripts/test-offline.ts`, `test-lock-mode.ts`, `test-sentence.ts`): start their own production server (requires `npm run build` first) against the public starter-template board, no auth needed. They cover the offline service worker (including iOS 206 byte-range audio), locked kiosk mode, and the sentence builder. Shared server startup/teardown lives in `scripts/lib/prod-server.ts` (cross-platform process-tree kill — the offline test depends on the kill genuinely freeing the port).

Conventions: assert on `data-testid`/`data-*` state hooks (e.g. `data-playing` on cards, `confirm-dialog`, `public-board-card`, `board-toolbar-name`) or ARIA roles — never on Tailwind classes or DOM structure. Prefer seeding/asserting via the API over UI simulation where the UI isn't the thing under test (e.g. reorder uses the API, not synthetic drags). Test boards use unique `<Prefix> ${Date.now()}` names; a new prefix must be added to `TEST_BOARD_PREFIXES` in `e2e/global.setup.ts`. Don't e2e-test AI image generation (external API) or mic recording.

## Database & Migrations

The project uses Vercel Postgres with a versioned SQL migration system. Migration files live in `migrations/` as numbered SQL files (e.g. `001_initial_schema.sql`). Applied versions are tracked in a `schema_migrations` table so each migration runs exactly once.

### Commands

```bash
npm run db:migrate           # Apply all pending migrations
npm run db:migrate:status    # Show which migrations are applied vs pending
npm run db:migrate:baseline  # Mark all as applied without running SQL (for existing DBs)
```

### Adding a new migration

1. Create `migrations/NNN_description.sql` with the next number
2. Write idempotent SQL (use `IF NOT EXISTS`, `IF EXISTS` where possible)
3. Run `npm run db:migrate`
4. Update `schema.sql` to reflect the new full schema state (reference file only)

### Current tables

- `schema_migrations` - tracks applied migration versions
- `boards` - user communication boards
- `cards` - Communication cards within boards (FK to boards with CASCADE delete)
- `board_likes` - likes on public boards (unique per user+board)
- `board_comments` - comments on public boards

### Key column mapping

DB uses `snake_case`, app uses `camelCase`. Notable: DB column `type` maps to app field `category`. Mapping lives in `src/lib/storage.ts`.

## File Storage

The project uses Vercel Storage (Postgres + Blob) for managing boards and cards data. See `ARCHITECTURE.md` for details.

## Offline Support / PWA

The app is an installable PWA with offline support:

- `src/app/manifest.ts` - web app manifest (standalone display, icons in `public/icons/`)
- `public/sw.js` - hand-written service worker. Cache strategies: cache-first for immutable Vercel Blob media and `/_next/static`, network-first with cache fallback for navigations/RSC/API GETs, `public/offline.html` fallback for never-visited pages. Byte-range requests are answered with real 206 slices from the cached full file — iOS refuses a 200 reply to a ranged audio request, so this is what makes cached audio play on iPhone/iPad. Bump `CACHE_VERSION` in `sw.js` when a deploy must flush stale cached pages (media cache is versioned separately and survives bumps — its URLs are immutable).
- `src/components/ServiceWorkerRegistration.tsx` - registers the worker (production only)
- `src/components/DocumentCacheWarmer.tsx` - asks the service worker (via a `warm-document` postMessage) to fetch and cache key pages (`/`, `/my-boards`, `/public-boards`, `/board/*`) as full HTML after client-side navigations, because Next.js soft navigations only fetch RSC payloads and would otherwise leave nothing launchable offline. The worker does the fetch itself: a page-side fetch's response streams to two consumers (page + cache.put clone) and the browser can cancel the shared stream, silently aborting the cache write
- `src/hooks/useAudioPreload.ts` - prefetches all card audio when a board opens so taps speak instantly and work offline
- `src/hooks/useOfflineAuth.ts` - Clerk can't confirm sessions offline, so this remembers "device had a signed-in user" in localStorage and keeps My Boards navigation visible offline (used by the landing page, GlobalHeader, BottomNav). Cached pages are server-rendered per-user and display without live auth.
- PWA `start_url` is `/my-boards` (cached board list) so an offline app launch lands somewhere useful
- `next.config.ts` serves `/sw.js` with `no-cache` so worker updates deploy immediately

Commands: `npm run icons` regenerates PNG icons from `public/logo.svg`; `npm run test:offline` runs a Playwright end-to-end offline test (requires `npm run build` first — it starts its own server, kills it, and asserts cached pages + offline fallback still work).

## Locked "Use Mode" (Child/Kiosk Mode)

Boards open unlocked; a carer explicitly locks a board into fullscreen "use mode" so a non-verbal child can't accidentally navigate away, hit the back button, or disturb a carefully built board:

- `src/contexts/LockModeContext.tsx` - tracks `lockedBoardId` (non-null = locked), persists to `sessionStorage` (`mvb:locked-board`) so a reload doesn't unlock, toggles a `lock-mode` class on `document.body`
- `src/hooks/useLockEffects.ts` - side effects while locked: screen wake lock (re-acquired on visibility change), best-effort fullscreen, and a `popstate`/history-sentinel trap that snaps browser/hardware back to the board. When the trap blocks a back navigation it dispatches a `mvb:lock-blocked` window event (`LOCK_BLOCKED_EVENT`)
- `src/components/lock/` - `LockedBar.tsx` (minimal top bar: board name, card-size toggle, unlock button), `UnlockButton.tsx` (must be pressed and held ~1s — with a progress ring — before the carer quiz opens; a quick tap only shows a transient "Hold to unlock" hint pill, and `mvb:lock-blocked` events re-pulse the button and show a "Board is locked" hint), `UnlockQuizDialog.tsx` (simple addition question with decoy answers, positioned below the top of the screen with a high z-index so it sits above the card grid; 3 wrong attempts closes the dialog and stays locked)
- Entry point: the lock button in `BoardToolbar.tsx`'s view-mode bar — it calls `lock()` inside the click gesture so `requestFullscreen()` is allowed. Clicking a board card in `MyBoardsClient.tsx` just opens the board unlocked
- While locked: `GlobalHeader` renders nothing, `BoardClient` swaps `BoardToolbar` for `LockedBar` and hides `LikeButton`/`CommentsSection`. Card taps, audio, category filter chips, and the card-size toggle still work
- No URL param is used for lock state (unlike `?edit=true`) so the service worker's per-pathname offline cache isn't affected
- `npm run test:lock-mode` runs a Playwright end-to-end test against the public `starter-template` board (requires `npm run build` first)

## Design Philosophy

- Accessibility-first design with large, clear buttons
- Simple, intuitive interface for ease of use
- Visual clarity with emoji/image support
- Responsive design for various devices
- Dark mode support

## Recent Changes

Based on git history:
- Added Clerk authentication integration
- Created landing page with hero section
- Set up basic routing structure
- Multiple refinement edits

## Environment Variables Needed

When setting up this project, you'll likely need:
- `POSTGRES_URL` - Vercel Postgres connection string (required for DB and migrations)
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob storage token
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` - Clerk auth
- `GOOGLE_AI_API_KEY` - Google AI (for image generation)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` - Email notifications (optional)

## Notes for Development

- The app uses Next.js App Router (not Pages Router)
- All API routes are in the `app/api` directory
- Client components use 'use client' directive
- Middleware handles authentication protection
- TypeScript types are centralized in `src/types/index.ts`
