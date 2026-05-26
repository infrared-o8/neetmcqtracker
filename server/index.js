import express from "express";
import cors from "cors";
import "dotenv/config";
import { AccessToken } from "livekit-server-sdk";
import rateLimit from "express-rate-limit";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { connectDB, db, getLeaderboard, getPlayer, updateStats, upsertPlayer } from "./db.js";

// Connect to MongoDB
connectDB();

// Render uses dynamic ports
const PORT = process.env.PORT || 3847;

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const LIVEKIT_URL = process.env.VITE_LIVEKIT_URL || "";

const app = express();

app.set("trust proxy", 1);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Player-Id", 
    "X-Server-Pin", 
    "ngrok-skip-browser-warning",
    "access-control-allow-private-network"
  ]
}));

app.use(express.json({ limit: "64kb" }));

// --- Part 1.3: Standard Request Throttling ---
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

app.use("/api/leaderboard", apiLimiter);
app.use("/api/players", apiLimiter);

// --- Part 1.1 & 1.2: Anti-Cheat & Velocity Logic ---
const userTracking = new Map();
const MAX_MCQ_PER_MIN = 15; // Increased to 15 to allow for burst logging
const MAX_PAGES_PER_MIN = 10;
const MAX_DAILY_AP = 1200;

function antiCheatMiddleware(req, res, next) {
  const playerId = req.headers["x-player-id"] || req.params.playerId;
  if (!playerId) return next();

  const now = Date.now();
  const ONE_MINUTE = 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  // Initialize tracker if not exists
  if (!userTracking.has(playerId)) {
    userTracking.set(playerId, {
      mcqLogs: [],
      pageLogs: [],
      dailyAp: 0,
      dayStart: now,
      lastSolved: null, // Null indicates initial sync
      lastPages: null
    });
  }

  const tracker = userTracking.get(playerId);

  // Reset daily cap rolling window
  if (now - tracker.dayStart > ONE_DAY) {
    tracker.dailyAp = 0;
    tracker.dayStart = now;
  }

  const incomingStats = req.body;
  if (incomingStats && (incomingStats.totalSolved !== undefined || incomingStats.totalPagesRead !== undefined)) {
    
    // Check if this is the VERY FIRST sync for this process
    const isInitialSync = tracker.lastSolved === null;
    
    const prevSolved = tracker.lastSolved ?? incomingStats.totalSolved;
    const prevPages = tracker.lastPages ?? incomingStats.totalPagesRead;
    
    const incomingSolved = incomingStats.totalSolved ?? prevSolved;
    const incomingPages = incomingStats.totalPagesRead ?? prevPages;

    const mcqDelta = Math.max(0, incomingSolved - prevSolved);
    const pagesDelta = Math.max(0, incomingPages - prevPages);
    
    // RULE: If it's an initial sync, we accept the total WITHOUT velocity checking
    // This allows users with 50+ MCQs locally to upload them to the cloud.
    if (!isInitialSync) {
      if (mcqDelta > 0) tracker.mcqLogs.push({ time: now, count: mcqDelta });
      if (pagesDelta > 0) tracker.pageLogs.push({ time: now, count: pagesDelta });
      
      // Purge old logs outside the 1-minute window
      tracker.mcqLogs = tracker.mcqLogs.filter(log => now - log.time <= ONE_MINUTE);
      tracker.pageLogs = tracker.pageLogs.filter(log => now - log.time <= ONE_MINUTE);
      
      const recentMcqs = tracker.mcqLogs.reduce((acc, log) => acc + log.count, 0);
      const recentPages = tracker.pageLogs.reduce((acc, log) => acc + log.count, 0);
      
      // Rule 1: Mathematical Rate Safeguards
      if (recentMcqs > MAX_MCQ_PER_MIN || recentPages > MAX_PAGES_PER_MIN) {
        console.warn(`[Anti-Cheat] Velocity threshold exceeded for ${playerId} (MCQ: ${recentMcqs})`);
        return res.status(429).json({ error: "Velocity threshold exceeded. Please slow down your logging." });
      }
    }
    
    // Rule 2: Daily Cap Ingestion (Always applied)
    const apDelta = mcqDelta + pagesDelta; 
    tracker.dailyAp += apDelta;
    if (tracker.dailyAp > MAX_DAILY_AP) {
      console.warn(`[Anti-Cheat] Daily AP cap exceeded for ${playerId}`);
      return res.status(429).json({ error: "Daily AP cap of 1200 exceeded." });
    }

    tracker.lastSolved = incomingSolved;
    tracker.lastPages = incomingPages;
  }

  next();
}

function requirePlayer(req, res, next) {
  const playerId = req.headers["x-player-id"] || req.params.playerId;
  if (!playerId) {
    return res.status(400).json({ error: "Missing X-Player-Id" });
  }
  req.playerId = playerId;
  next();
}

// --- Auth Middleware Configuration ---
// If CLERK_SECRET_KEY is provided, we strictly enforce OAuth token verification.
// Otherwise, we allow bypass for local dev fallback.
const authMiddleware = process.env.CLERK_SECRET_KEY 
  ? ClerkExpressRequireAuth() 
  : (req, res, next) => next();

// --- Routes ---

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: Date.now(), port: PORT, status: "production-ready", authEnabled: !!process.env.CLERK_SECRET_KEY });
});

app.post("/api/livekit/token", async (req, res) => {
  const { playerName, roomName } = req.body;
  if (!playerName) return res.status(400).json({ error: "playerName is required" });

  const room = roomName || "NEET-Study-Room";
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: playerName });
  at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

  res.json({ token: await at.toJwt(), serverUrl: LIVEKIT_URL });
});

app.post("/api/players/register", authMiddleware, async (req, res) => {
  const { playerId, displayName, decor } = req.body;
  if (!playerId || !displayName) return res.status(400).json({ error: "playerId and displayName required" });
  
  // Guard against identity spoofing if using Clerk
  if (req.auth && req.auth.userId !== playerId) {
    return res.status(403).json({ error: "Identity mismatch. Token does not match requested player ID." });
  }

  await upsertPlayer({
    playerId,
    displayName: String(displayName).slice(0, 24),
    decor: decor || {},
  });
  const player = await getPlayer(playerId);
  res.json({ ok: true, player });
});

app.patch("/api/players/:playerId", authMiddleware, requirePlayer, async (req, res) => {
  if (req.auth && req.auth.userId !== req.playerId) {
    return res.status(403).json({ error: "Identity mismatch." });
  }

  const existing = await getPlayer(req.playerId);
  if (!existing) return res.status(404).json({ error: "Player not found" });
  
  const { displayName, decor } = req.body;
  await upsertPlayer({
    playerId: req.playerId,
    displayName: displayName ?? existing.displayName,
    decor: decor ?? existing.decor,
  });
  res.json({ ok: true });
});

app.put("/api/players/:playerId/stats", authMiddleware, requirePlayer, antiCheatMiddleware, async (req, res) => {
  if (req.auth && req.auth.userId !== req.playerId) {
    return res.status(403).json({ error: "Identity mismatch." });
  }

  let player = await getPlayer(req.playerId);
  if (!player) {
    await upsertPlayer({
      playerId: req.playerId,
      displayName: req.body.displayName || "Aspirant",
      decor: req.body.decor || {},
    });
    player = await getPlayer(req.playerId);
  }
  
  const stats = req.body;
  await updateStats(req.playerId, {
    xp: stats.xp ?? player.xp,
    level: stats.level ?? player.level,
    totalSolved: stats.totalSolved ?? player.totalSolved,
    totalPagesRead: stats.totalPagesRead ?? player.totalPagesRead,
    streak: stats.streak ?? player.streak,
    bestStreak: stats.bestStreak ?? player.bestStreak,
    rankLabel: stats.rankLabel ?? player.rankLabel,
    studyMinutes: stats.studyMinutes != null ? Number(stats.studyMinutes) || 0 : (player.studyMinutes ?? 0),
    dailyLogs: stats.dailyLogs ?? player.dailyLogs,
    dailyPageLogs: stats.dailyPageLogs ?? player.dailyPageLogs,
  });
  
  res.json({ ok: true });
});

app.get("/api/leaderboard", async (req, res) => {
  const sort = req.query.sort || "activity";
  const players = await getLeaderboard(sort);
  res.json({ players });
});

app.get("/api/players/:playerId", async (req, res) => {
  const player = await getPlayer(req.params.playerId);
  if (!player) return res.status(404).json({ error: "Not found" });
  res.json(player);
});

// Error handling middleware for Clerk Auth
app.use((err, req, res, next) => {
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: "Unauthenticated request. Valid Clerk JWT required." });
  }
  next(err);
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEET Leaderboard Server running on port ${PORT}`);
  console.log(`Database Engine: ${db.name}`);
  console.log(`Auth Strategy: ${process.env.CLERK_SECRET_KEY ? "Clerk OAuth" : "Local Development Bypass"}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use.`);
    process.exit(1);
  }
  throw err;
});
