import express from "express";
import cors from "cors";
import os from "os";
import { db, getLeaderboard, getPlayer, updateStats, upsertPlayer } from "./db.js";

const PORT = Number(process.env.PORT) || 3847;
const SERVER_PIN = process.env.SERVER_PIN || "";

const app = express();

// Comprehensive CORS configuration
app.use(cors({
  origin: true, // Echoes the request origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "X-Player-Id", 
    "X-Server-Pin", 
    "ngrok-skip-browser-warning",
    "access-control-allow-private-network"
  ],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

// Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

app.use(express.json({ limit: "64kb" }));

function requirePin(req, res, next) {
  if (!SERVER_PIN) return next();
  if (req.headers["x-server-pin"] === SERVER_PIN) return next();
  res.status(401).json({ error: "Invalid server pin" });
}

function requirePlayer(req, res, next) {
  const playerId = req.headers["x-player-id"] || req.params.playerId;
  if (!playerId) {
    res.status(400).json({ error: "Missing X-Player-Id" });
    return;
  }
  req.playerId = playerId;
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: Date.now(), port: PORT });
});

app.post("/api/players/register", requirePin, (req, res) => {
  const { playerId, displayName, decor } = req.body;
  if (!playerId || !displayName) {
    res.status(400).json({ error: "playerId and displayName required" });
    return;
  }
  upsertPlayer({
    playerId,
    displayName: String(displayName).slice(0, 24),
    decor: decor || {},
  });
  res.json({ ok: true, player: getPlayer(playerId) });
});

app.patch("/api/players/:playerId", requirePin, requirePlayer, (req, res) => {
  const existing = getPlayer(req.playerId);
  if (!existing) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  const { displayName, decor } = req.body;
  upsertPlayer({
    playerId: req.playerId,
    displayName: displayName ?? existing.display_name,
    decor: decor ?? JSON.parse(existing.decor_json || "{}"),
  });
  res.json({ ok: true });
});

app.put("/api/players/:playerId/stats", requirePin, requirePlayer, (req, res) => {
  let player = getPlayer(req.playerId);
  if (!player) {
    upsertPlayer({
      playerId: req.playerId,
      displayName: req.body.displayName || "Aspirant",
      decor: req.body.decor || {},
    });
    player = getPlayer(req.playerId);
  }
  const stats = req.body;
  updateStats(req.playerId, {
    xp: stats.xp ?? player.xp,
    level: stats.level ?? player.level,
    totalSolved: stats.totalSolved ?? player.total_solved,
    totalPagesRead: stats.totalPagesRead ?? player.total_pages_read,
    streak: stats.streak ?? player.streak,
    bestStreak: stats.bestStreak ?? player.best_streak,
    rankLabel: stats.rankLabel ?? player.rank_label,
    studyMinutes:
      stats.studyMinutes != null
        ? Number(stats.studyMinutes) || 0
        : (player.study_minutes ?? 0),
  });
  res.json({ ok: true });
});

app.get("/api/leaderboard", (req, res) => {
  const sort = req.query.sort || "activity";
  res.json({ players: getLeaderboard(sort) });
});

app.get("/api/players/:playerId", (req, res) => {
  const row = getPlayer(req.params.playerId);
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    playerId: row.player_id,
    displayName: row.display_name,
    decor: JSON.parse(row.decor_json || "{}"),
    xp: row.xp,
    level: row.level,
    totalSolved: row.total_solved,
    totalPagesRead: row.total_pages_read,
    activityTotal:
      row.total_solved + row.total_pages_read + (row.study_minutes ?? 0) * 0.5,
    streak: row.streak,
    bestStreak: row.best_streak,
    rankLabel: row.rank_label,
    studyMinutes: row.study_minutes ?? 0,
  });
});

function printLanAddresses() {
  const nets = os.networkInterfaces();
  const lines = [];
  for (const entries of Object.values(nets)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        lines.push(`  → http://${entry.address}:${PORT}`);
      }
    }
  }
  if (lines.length) {
    console.log("\nFriends connect using one of these URLs in Settings:");
    lines.forEach((l) => console.log(l));
  }
  console.log("\nWindows firewall (run as Admin if friends cannot connect):");
  console.log(
    `  netsh advfirewall firewall add rule name="NEET Tracker LB" dir=in action=allow protocol=TCP localport=${PORT}`,
  );
}

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEET leaderboard server listening on 0.0.0.0:${PORT}`);
  console.log(`DB: ${db.name}`);
  printLanAddresses();
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\nPort ${PORT} is already in use — server may already be running.`);
    console.error("  npm run server:stop   then   npm run server\n");
    process.exit(1);
  }
  throw err;
});
