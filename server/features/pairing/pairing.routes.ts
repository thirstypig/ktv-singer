import type { Express } from "express";
import { randomUUID, randomBytes } from "crypto";
import type { PairingSession } from "./pairing.types";

/** In-memory session store — shared with pairing.socket.ts */
export const sessions = new Map<string, PairingSession>();

/** Clean up sessions older than 4 hours */
const SESSION_TTL = 4 * 60 * 60 * 1000;

function pruneExpired() {
  const now = Date.now();
  const expired: string[] = [];
  sessions.forEach((session, id) => {
    if (now - session.createdAt > SESSION_TTL) {
      expired.push(id);
    }
  });
  expired.forEach((id) => sessions.delete(id));
}

// ── Rate limiting ─────────────────────────────────────────────
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 10; // max sessions per IP per window
const MAX_TOTAL_SESSIONS = 100;
const ipRequestLog = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestLog.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  ipRequestLog.set(ip, recent);
  return recent.length >= RATE_LIMIT_MAX;
}

function recordRequest(ip: string) {
  const timestamps = ipRequestLog.get(ip) || [];
  timestamps.push(Date.now());
  ipRequestLog.set(ip, timestamps);
}

export function registerPairingRoutes(app: Express) {
  /** POST /api/pairing/sessions — create a new ephemeral session */
  app.post("/api/pairing/sessions", (req, res) => {
    pruneExpired();

    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Rate limit per IP
    if (isRateLimited(ip)) {
      res.status(429).json({ message: "Too many sessions created. Try again later." });
      return;
    }

    // Global session cap
    if (sessions.size >= MAX_TOTAL_SESSIONS) {
      res.status(503).json({ message: "Server at capacity. Try again later." });
      return;
    }

    recordRequest(ip);

    const id = randomUUID();
    const tvSecret = randomBytes(16).toString("hex");
    const session: PairingSession = {
      id,
      tvSecret,
      createdAt: Date.now(),
      members: new Map(),
      queue: [],
      currentlyPlaying: null,
    };
    sessions.set(id, session);

    res.json({ sessionId: id, tvSecret });
  });

  /** GET /api/pairing/sessions/:id — check if a session exists */
  app.get("/api/pairing/sessions/:id", (req, res) => {
    const session = sessions.get(req.params.id);
    if (!session) {
      res.status(404).json({ message: "Session not found" });
      return;
    }

    const singers: Array<{ socketId: string; deviceName: string }> = [];
    let tvConnected = false;
    session.members.forEach((m) => {
      if (m.role === "singer") {
        singers.push({ socketId: m.socketId, deviceName: m.deviceName });
      }
      if (m.role === "tv") {
        tvConnected = true;
      }
    });

    res.json({ sessionId: session.id, singers, tvConnected });
  });
}
