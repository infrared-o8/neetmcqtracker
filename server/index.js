import express from "express";
import cors from "cors";
import "dotenv/config";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import rateLimit from "express-rate-limit";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { connectDB, db, getLeaderboard, getPlayer, updateStats, upsertPlayer, Room } from "./db.js";

// Connect to MongoDB
connectDB();

// Render uses dynamic ports
const PORT = process.env.PORT || 3847;

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
const LIVEKIT_URL = process.env.VITE_LIVEKIT_URL || "";

// Room service for metadata and management
const svc = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

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

const roomLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { error: "Slow down room actions." }
});

app.use("/api/leaderboard", apiLimiter);
app.use("/api/players", apiLimiter);
app.use("/api/rooms", roomLimiter);

// --- Part 1.1 & 1.2: Anti-Cheat & Velocity Logic ---
const userTracking = new Map();
const MAX_MCQ_PER_MIN = 100; // Increased significantly for sync flexibility
const MAX_PAGES_PER_MIN = 50;
const MAX_DAILY_AP = 5000; // Increased daily cap

function antiCheatMiddleware(req, res, next) {
  const playerId = req.headers["x-player-id"] || req.params.playerId;
  if (!playerId) return next();

  const now = Date.now();
  const ONE_MINUTE = 60 * 1000;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  if (!userTracking.has(playerId)) {
    userTracking.set(playerId, {
      mcqLogs: [],
      pageLogs: [],
      dailyAp: 0,
      dayStart: now,
      lastSolved: null,
      lastPages: null
    });
  }

  const tracker = userTracking.get(playerId);

  if (now - tracker.dayStart > ONE_DAY) {
    tracker.dailyAp = 0;
    tracker.dayStart = now;
  }

  const incomingStats = req.body;
  if (incomingStats && (incomingStats.totalSolved !== undefined || incomingStats.totalPagesRead !== undefined)) {
    console.log(`[Sync] Incoming stats for ${playerId}:`, {
      solved: incomingStats.totalSolved,
      pages: incomingStats.totalPagesRead,
      minutes: incomingStats.studyMinutes
    });

    const isInitialSync = tracker.lastSolved === null;
    const prevSolved = tracker.lastSolved ?? incomingStats.totalSolved;
    const prevPages = tracker.lastPages ?? incomingStats.totalPagesRead;
    const incomingSolved = incomingStats.totalSolved ?? prevSolved;
    const incomingPages = incomingStats.totalPagesRead ?? prevPages;

    const mcqDelta = Math.max(0, incomingSolved - prevSolved);
    const pagesDelta = Math.max(0, incomingPages - prevPages);
    
    if (mcqDelta > 0 || pagesDelta > 0) {
      console.log(`[Anti-Cheat] Progress detected for ${playerId}: +${mcqDelta} MCQs, +${pagesDelta} Pages`);
    }

    if (!isInitialSync && (mcqDelta > 0 || pagesDelta > 0)) {
      tracker.mcqLogs = tracker.mcqLogs.filter(log => now - log.time <= ONE_MINUTE);
      tracker.pageLogs = tracker.pageLogs.filter(log => now - log.time <= ONE_MINUTE);
      
      const recentMcqs = tracker.mcqLogs.reduce((acc, log) => acc + log.count, 0) + mcqDelta;
      const recentPages = tracker.pageLogs.reduce((acc, log) => acc + log.count, 0) + pagesDelta;
      
      if (recentMcqs > MAX_MCQ_PER_MIN || recentPages > MAX_PAGES_PER_MIN) {
        console.warn(`[Anti-Cheat] Velocity threshold exceeded for ${playerId} (Recent MCQ: ${recentMcqs})`);
        return res.status(429).json({ error: "Velocity threshold exceeded. Please slow down your logging." });
      }

      if (mcqDelta > 0) tracker.mcqLogs.push({ time: now, count: mcqDelta });
      if (pagesDelta > 0) tracker.pageLogs.push({ time: now, count: pagesDelta });
      console.log(`[Anti-Cheat] Accepted deltas for ${playerId}: +${mcqDelta} MCQ, +${pagesDelta} Pages`);
    }
    
    const apDelta = mcqDelta + pagesDelta; 
    if (tracker.dailyAp + apDelta > MAX_DAILY_AP) {
      console.warn(`[Anti-Cheat] Daily AP cap exceeded for ${playerId}`);
      return res.status(429).json({ error: "Daily AP cap exceeded." });
    }

    tracker.dailyAp += apDelta;
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
  const { playerName, roomName, password } = req.body;
  if (!playerName) return res.status(400).json({ error: "playerName is required" });

  const room = roomName || "NEET-Study-Room";
  
  // If it's a specific room (not the default), check password
  if (roomName && roomName !== "NEET-Study-Room") {
    const roomDoc = await Room.findOne({ roomId: roomName });
    if (roomDoc && roomDoc.isPasswordProtected) {
      if (roomDoc.password !== password) {
        return res.status(403).json({ error: "Incorrect room password" });
      }
    }
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: playerName });
  at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

  res.json({ token: await at.toJwt(), serverUrl: LIVEKIT_URL });
});

app.get("/api/rooms", async (req, res) => {
  try {
    const rooms = await Room.find({}).sort({ createdAt: -1 }).lean();
    
    // Enrich with live participant counts from LiveKit
    const enrichedRooms = await Promise.all(rooms.map(async (r) => {
      let activeCount = 0;
      try {
        const participants = await svc.listParticipants(r.roomId);
        activeCount = participants.length;
      } catch {
        // Room might not exist in LiveKit yet (no one in it)
      }

      return {
        roomId: r.roomId,
        title: r.title,
        description: r.description,
        creatorId: r.creatorId,
        creatorName: r.creatorName,
        capacity: r.capacity,
        activeCount,
        isPasswordProtected: r.isPasswordProtected,
        isMicOpen: r.isMicOpen,
        createdAt: r.createdAt
      };
    }));

    res.json({ rooms: enrichedRooms });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/rooms", authMiddleware, async (req, res) => {
  const { title, description, capacity, password, creatorId, creatorName, isMicOpen } = req.body;
  if (!title || !creatorId || !creatorName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Identity check
  if (req.auth && req.auth.userId !== creatorId) {
    return res.status(403).json({ error: "Identity mismatch" });
  }

  try {
    // Check if user already has a room
    const existing = await Room.findOne({ creatorId });
    if (existing) {
      return res.status(400).json({ error: "You can only create one room at a time." });
    }

    const roomId = `room-${Math.random().toString(36).slice(2, 9)}`;
    const newRoom = new Room({
      roomId,
      title: String(title).slice(0, 50),
      description: String(description || "").slice(0, 200),
      capacity: Math.min(Math.max(Number(capacity) || 20, 2), 50),
      password: password || "",
      isPasswordProtected: !!password,
      isMicOpen: !!isMicOpen,
      creatorId,
      creatorName
    });

    await newRoom.save();
    res.json({ ok: true, room: newRoom });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/rooms/:roomId", authMiddleware, async (req, res) => {
  const { roomId } = req.params;
  const playerId = req.headers["x-player-id"];

  try {
    const room = await Room.findOne({ roomId });
    if (!room) return res.status(404).json({ error: "Room not found" });

    // Only creator can delete
    if (room.creatorId !== playerId && (!req.auth || req.auth.userId !== room.creatorId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // 1. Delete from MongoDB
    await Room.deleteOne({ roomId });

    // 2. Forcibly close in LiveKit (disconnects everyone)
    try {
      await svc.deleteRoom(roomId);
    } catch (lkErr) {
      // Might already be empty/deleted in LK
      console.warn(`LiveKit room deletion skipped: ${lkErr.message}`);
    }

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
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

  const ok = await updateStats(req.playerId, req.body);
  if (!ok) {
    // If update failed (likely user doesn't exist yet), ensure they are registered
    await upsertPlayer({
      playerId: req.playerId,
      displayName: req.body.displayName || "Aspirant",
      decor: req.body.decor || {},
    });
    await updateStats(req.playerId, req.body);
  }
  
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
