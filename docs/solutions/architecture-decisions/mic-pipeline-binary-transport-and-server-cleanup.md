---
title: "Real-time mic streaming: binary transport, server cleanup, and security hygiene"
category: architecture-decisions
tags:
  - socket-io
  - audio-streaming
  - binary-transport
  - expo-audio
  - avfaudioengine
  - drizzle-orm
  - input-validation
  - dead-code-removal
  - react-hooks
module:
  - ktv-singer-app
  - ktv-singer-server
  - ktv-singer-tvos
  - ktv-singer-shared
symptom: >
  Mic-to-TV audio pipeline compiled but was never end-to-end tested. Base64 encoding
  added 33% overhead, 250ms chunks caused 400-600ms latency, phone disconnect left
  tvOS engine running forever. Server had 160-LOC delegation-only storage.ts, mixed
  error shapes, untyped auth, missing DB indexes, and unvalidated playlist updates.
root_cause:
  - Base64 string encoding on Socket.IO adds ~33% size overhead vs binary Uint8Array
  - 250ms chunk duration creates unavoidable 400-600ms end-to-end latency
  - No socket disconnect listener — tvOS AVAudioEngine never stops on client drop
  - Android expo-audio default encoder produces AAC, not WAV PCM
  - storage.ts was pure pass-through with no alternate implementations
  - Error responses mixed {message} and {error} across routes
  - Auth middleware used `any` despite typed interfaces existing
date_solved: "2026-03-24"
---

# Real-time Mic Streaming + Server Cleanup

## Problem

The KTV Singer karaoke app had mic recording code across all three tiers (Expo app, Express server, tvOS) but it had never been tested end-to-end. Analysis revealed multiple issues that would prevent it from working well:

1. **Latency**: 250ms chunk duration + base64 encoding + file I/O = 400-600ms total
2. **No disconnect handling**: Phone sleep or network drop left tvOS audio engine running forever
3. **Cross-platform broken**: Android produces AAC (not PCM), web can't produce WAV
4. **Server cruft**: 160-LOC storage abstraction doing nothing, mixed error shapes, `any` types

## Investigation

- Research confirmed `expo-audio` on Android uses `MediaRecorder` which **cannot produce WAV PCM**
- `FileHandle.readBytes()` (Expo SDK 54+) is ~10x faster than `file.base64()`
- Socket.IO 4.x auto-detects `Uint8Array` and sends native WebSocket binary frames
- `@siteed/expo-audio-studio` is the only path to cross-platform PCM (future migration)

## Solution

### Audio Pipeline Changes

**Chunk duration**: 250ms → 100ms (cuts 150ms latency)

**File reading**: `file.base64()` → `FileHandle.readBytes()` (sync API, returns `Uint8Array`)

**WAV header stripping**: Strip 44-byte RIFF header before sending — tvOS receives raw PCM

**Binary transport**: Emit `Uint8Array` directly via Socket.IO — auto-detected as binary, sent as WebSocket binary frame (no base64 on the wire)

**Disconnect handling**: Added `socket.on('disconnect')` listener in `useMicrophone` to auto-stop streaming

**tvOS sender timeout**: 5-second timer — if no chunks arrive, remove sender from `activeSenders` and stop engine

**Platform flag**: `MIC_SUPPORTED = Platform.OS === 'ios'` with graceful "unsupported" status for Android/web

### Server Cleanup

**Storage removal**: Deleted `IStorage` + `DatabaseStorage` (160 LOC). Routes import directly from feature storage modules. One documented cross-feature exception: `vocal-separation.routes.ts` imports `getSong` from `songs.storage`.

**Error standardization**: All `{ message }` → `{ error }` across auth middleware, pairing routes, global handler.

**Type safety**: Replaced all `catch (error: any)` with `catch (error: unknown)` + proper narrowing. Auth layer uses `AuthenticatedUser`/`OidcClaims` types.

**Security hygiene**: Installed `helmet`, added `requireAuthIfConfigured` to lyrics-offset, added `maxContentLength`/`timeout`/`maxRedirects` to Gaudio downloads, added `updatePlaylistSchema` validation.

**DB indexes**: Added indexes on all FK columns in Drizzle schemas (performances, user_song_plays, playlists, playlist_songs).

## Key Decisions

1. **iOS-first, defer Android/web**: expo-audio fundamentally can't produce PCM on Android. Platform feature flag is the pragmatic choice vs. migrating to a different library.

2. **Keep Socket.IO over WebRTC**: tvOS has no WebRTC support. Socket.IO binary over WebSocket is sufficient for home LAN latency.

3. **No jitter buffer**: Start without one. If audio quality is poor on hardware test, add later.

4. **Security proportional to threat model**: Home LAN app — kept quick security hygiene (helmet, schema validation, auth on routes) but deferred enterprise-grade SSRF/rate-limiting.

## Gotcha: React Rules of Hooks

The initial implementation had `if (!MIC_SUPPORTED) return` before `useState`/`useRef` calls — a Rules of Hooks violation. Fix: call all hooks unconditionally, then return the unsupported stub after hooks.

```typescript
// WRONG — conditional hooks
export function useMicrophone() {
  if (!MIC_SUPPORTED) return UNSUPPORTED_RETURN;  // before hooks!
  const [status, setStatus] = useState("idle");
  // ...
}

// CORRECT — hooks called unconditionally
export function useMicrophone() {
  const [status, setStatus] = useState(MIC_SUPPORTED ? "idle" : "unsupported");
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  // ... all hooks called ...
  if (!MIC_SUPPORTED) return UNSUPPORTED_RETURN;  // after hooks
  // ... rest of logic
}
```

## Prevention

- Always call hooks before any conditional returns in React components/hooks
- When removing abstraction layers, grep for all import sites and update CLAUDE.md
- Use `catch (error: unknown)` consistently — `any` in catch blocks defeats TypeScript's purpose
- For cross-platform features, verify the native API capabilities before building (Android MediaRecorder can't do PCM)

## Related

- Plan: `docs/plans/2026-03-24-feat-mic-architecture-review-fixes-plan.md`
- Todos: `todos/019-037-pending-*.md` (19 code review findings)
- Future: `@siteed/expo-audio-studio` for cross-platform PCM when Android/web mic is needed
