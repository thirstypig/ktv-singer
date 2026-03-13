# KTV Singer

YouTube-powered karaoke system with real-time device pairing, synced lyrics, and shared song queue.

## Repositories

| Repo | Description |
|------|-------------|
| [ktv-singer-shared](https://github.com/thirstypig/ktv-singer-shared) | Drizzle ORM schemas, Socket.IO type contracts |
| [ktv-singer-server](https://github.com/thirstypig/ktv-singer-server) | Express REST API + Socket.IO server |
| [ktv-singer-app](https://github.com/thirstypig/ktv-singer-app) | Expo React Native mobile client (iOS, Android, web) |
| [ktv-singer-tvos](https://github.com/thirstypig/ktv-singer-tvos) | Native Apple TV app (SwiftUI, AVPlayer) |
| [ktv-singer-docs](https://github.com/thirstypig/ktv-singer-docs) | Documentation, roadmap, design guidelines |
| [ktv-singer-infra](https://github.com/thirstypig/ktv-singer-infra) | Docker, CI/CD configuration |
| [ktv-singer-web](https://github.com/thirstypig/ktv-singer-web) | Placeholder for future web client |

## Architecture

```
Phone (Expo)                    Apple TV (SwiftUI)
  |                                |
  +-- REST ------------+  +------ REST
  +-- Socket.IO -------+  +--- Socket.IO
  +-- Audio chunks ----+  +-- Audio playback
                       |  |
                 Express API (port 4040)
                 +-- /api/songs --> Supabase PostgreSQL
                 +-- /api/youtube/stream/:id --> yt-dlp --> YouTube CDN
                 +-- Socket.IO /pairing --> queue, audio relay
```

## Quick Start

```bash
# Clone all repos
gh repo clone thirstypig/ktv-singer-shared
gh repo clone thirstypig/ktv-singer-server
gh repo clone thirstypig/ktv-singer-app

# Start the server
cd ktv-singer-server && npm install && npm run dev

# Start the mobile app (separate terminal)
cd ktv-singer-app && npm install && npm start
```
