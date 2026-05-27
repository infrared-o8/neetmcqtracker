import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the same directory as index.js
dotenv.config({ path: path.join(__dirname, ".env") });

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

// --- Part 1.1 & 1.2: Anti-Cheat & Velocity Logic (DISABLED for Development) ---
function antiCheatMiddleware(req, res, next) {
  // Anti-cheat disabled as per request for high-intensity study sessions.
  // All progress is currently accepted without velocity checks.
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
  
  // If it's a specific room (not the default), check password and capacity
  if (roomName && roomName !== "NEET-Study-Room") {
    const roomDoc = await Room.findOne({ roomId: roomName });
    if (!roomDoc) return res.status(404).json({ error: "Room not found" });

    // Check Password
    if (roomDoc.isPasswordProtected) {
      if (roomDoc.password !== password) {
        return res.status(403).json({ error: "Incorrect room password" });
      }
    }

    // Enforce Capacity via LiveKit check
    try {
      const participants = await svc.listParticipants(roomName);
      if (participants.length >= roomDoc.capacity) {
        return res.status(403).json({ error: "Room is at maximum capacity. Please wait for someone to leave." });
      }
    } catch (lkErr) {
      console.warn(`Capacity check failed for ${roomName}: ${lkErr.message}`);
    }
  }

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { identity: playerName });
  at.addGrant({ roomJoin: true, room: room, canPublish: true, canSubscribe: true });

  res.json({ token: await at.toJwt(), serverUrl: LIVEKIT_URL });
});

app.get("/api/rooms", async (req, res) => {
  try {
    const dbRooms = await Room.find({}).sort({ createdAt: -1 }).lean();
    
    // Add Global Hall to the list for enrichment if not already there
    const roomsToEnrich = [...dbRooms];
    if (!roomsToEnrich.find(r => r.roomId === "NEET-Study-Room")) {
      roomsToEnrich.push({
        roomId: "NEET-Study-Room",
        title: "Global High-Yield Hall",
        description: "The official 24/7 focus hall for all aspirants. Open to everyone.",
        creatorName: "System",
        capacity: 50,
        isPasswordProtected: false,
        isMicOpen: false,
        isSystem: true
      });
    }

    // Enrich with live participant counts from LiveKit
    const enrichedRooms = await Promise.all(roomsToEnrich.map(async (r) => {
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
        createdAt: r.createdAt,
        isSystem: r.isSystem
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

  try {
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
  } catch (error) {
    console.error("Stats Update Route Error:", error);
    res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
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
