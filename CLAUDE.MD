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
└── middleware.ts            # Clerk authentication middleware

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
- Protected routes use middleware.ts
- SignIn/SignUp available on landing page
- User-specific data isolation via userId

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

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
