# KTV Singer

YouTube-powered karaoke app with synced lyrics, scoring, playlists, and vocal separation. Monorepo with an Express API server, React Native mobile client, and an in-progress tvOS port.

## Architecture

| Directory | Purpose | Tech |
|-----------|---------|------|
| `server/` | REST API, YouTube search, lyrics, scoring, auth | Express, Drizzle ORM, Supabase PostgreSQL, Passport.js |
| `mobile/` | iOS/Android/web client | Expo, React Native, NativeWind, React Navigation |
| `tvos/` | Native Apple TV port (in progress) | SwiftUI, AVKit, Supabase |
| `shared/` | Database schema shared between server and mobile | Drizzle ORM, Zod |
| `docs/` | Extended documentation (tvOS setup, architecture) | Markdown |

## Features

- **YouTube search** — search and play karaoke videos via YouTube Data API
- **Synced lyrics** — fetch from LRCLIB, display with word-level timing and user-adjustable offset
- **Scoring** — track play history and performance scores
- **Playlists** — create and manage song queues
- **Vocal separation** — isolate vocals/instrumentals via LaLaL.ai and Gaudio
- **Auth** — Google OIDC via Passport.js (optional in dev)
- **Device pairing** — QR code + Bonjour for tvOS ↔ iOS microphone input

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL (Supabase recommended) with `DATABASE_URL` in `.env`
- YouTube Data API key (`YOUTUBE_API_KEY`)

### Setup

```bash
# Install server dependencies
npm install

# Install mobile dependencies
cd mobile && npm install && cd ..

# Push database schema
npm run db:push

# Start the dev server (API on port 3000)
npm run dev:server

# In a separate terminal, start the mobile app
cd mobile && npm start
```

### Environment Variables

Create a `.env` file in the project root:

```
DATABASE_URL=postgresql://...
YOUTUBE_API_KEY=...
SESSION_SECRET=...
GOOGLE_CLIENT_ID=...       # optional in dev
GOOGLE_CLIENT_SECRET=...   # optional in dev
```

## Dev Commands

### Server (from project root)

| Command | Description |
|---------|-------------|
| `npm run dev:server` | Start dev server with hot reload |
| `npm run build:server` | Bundle for production (esbuild) |
| `npm run start:server` | Run production build |
| `npm run check:server` | TypeScript type check |
| `npm run db:push` | Push Drizzle schema to database |

### Mobile (from `mobile/`)

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm run web` | Run in browser |
| `npm run check` | TypeScript type check |

## Project Structure

```
ktv-singer/
├── server/
│   ├── features/
│   │   ├── auth/           # Passport.js, Google OIDC, sessions
│   │   ├── search/         # YouTube API, LRCLIB lyrics
│   │   ├── songs/          # Song CRUD
│   │   ├── playlist/       # Playlist management
│   │   ├── scoring/        # Play tracking, performance scores
│   │   └── vocal-separation/ # LaLaL.ai, Gaudio integration
│   ├── middleware/          # Auth middleware
│   ├── routes.ts            # Route registration
│   ├── storage.ts           # Storage interface
│   ├── db.ts                # Supabase/Drizzle connection
│   └── index.ts             # Express app entry point
├── mobile/
│   └── src/
│       ├── features/        # Feature modules (same pattern as server)
│       │   ├── auth/
│       │   ├── library/
│       │   ├── player/
│       │   ├── playlist/
│       │   ├── scoring/
│       │   ├── search/
│       │   └── vocal-separation/
│       ├── common/          # Shared components, hooks, utils
│       ├── navigation/      # React Navigation config
│       ├── screens/         # Screen components
│       └── theme/           # NativeWind theme
├── tvos/                    # Native tvOS port (SwiftUI)
│   ├── Shared/              # Models, Database, Services
│   └── Features/            # Player, SongBrowser, Auth, etc.
├── shared/
│   └── schema/              # Drizzle ORM schemas (songs, users, playlists, etc.)
└── docs/
    └── tvos/                # tvOS setup guides and architecture docs
```

## Feature Module Pattern

Both server and mobile use isolated feature modules:

```
features/<name>/
├── components/     # UI (mobile only)
├── hooks/          # React hooks (mobile only)
├── types/          # TypeScript types
├── utils/          # Feature-specific utilities
├── <name>.routes.ts    # API routes (server only)
├── <name>.storage.ts   # DB queries (server only)
└── index.ts        # Barrel export (public API)
```

Each feature exports through `index.ts`. No cross-feature imports — features communicate through the server API or shared schema types.

## Project Status

| Component | Status |
|-----------|--------|
| Server API | Working |
| Mobile (Expo) | Working |
| tvOS (SwiftUI) | In progress — code scaffolded, needs Xcode project setup |
| Web client | Removed (was Vite+React, migrated to React Native) |

## License

MIT
