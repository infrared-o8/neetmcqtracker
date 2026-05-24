import Database from "better-sqlite3";
import { existsSync, mkdirSync, readFileSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
const dbPath = join(dataDir, "database.sqlite");
const jsonDbPath = join(dataDir, "players.json");

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

const dbConn = new Database(dbPath);
dbConn.pragma("journal_mode = WAL");

// Initialize Schema
dbConn.exec(`
  CREATE TABLE IF NOT EXISTS players (
    player_id TEXT PRIMARY KEY,
    display_name TEXT,
    decor_json TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    total_solved INTEGER DEFAULT 0,
    total_pages_read INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    rank_label TEXT DEFAULT 'Beginner',
    study_minutes INTEGER DEFAULT 0,
    updated_at INTEGER
  )
`);

// Migration from JSON if exists
if (existsSync(jsonDbPath)) {
  try {
    const data = JSON.parse(readFileSync(jsonDbPath, "utf8"));
    const players = data.players || {};
    
    const insert = dbConn.prepare(`
      INSERT OR REPLACE INTO players (
        player_id, display_name, decor_json, xp, level, 
        total_solved, total_pages_read, streak, best_streak, 
        rank_label, study_minutes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = dbConn.transaction((playersMap) => {
      for (const [id, p] of Object.entries(playersMap)) {
        insert.run(
          id,
          p.display_name,
          p.decor_json,
          p.xp,
          p.level,
          p.total_solved,
          p.total_pages_read,
          p.streak,
          p.best_streak,
          p.rank_label,
          p.study_minutes ?? 0,
          p.updated_at
        );
      }
    });

    transaction(players);
    console.log(`Migrated ${Object.keys(players).length} players from JSON to SQLite.`);
    // unlinkSync(jsonDbPath); // Optional: delete after migration
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

export const db = { name: dbPath };

export function upsertPlayer({ playerId, displayName, decor }) {
  const existing = dbConn.prepare("SELECT * FROM players WHERE player_id = ?").get(playerId);
  
  if (existing) {
    dbConn.prepare(`
      UPDATE players 
      SET display_name = ?, decor_json = ?, updated_at = ?
      WHERE player_id = ?
    `).run(
      displayName,
      JSON.stringify(decor || {}),
      Date.now(),
      playerId
    );
  } else {
    dbConn.prepare(`
      INSERT INTO players (player_id, display_name, decor_json, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(
      playerId,
      displayName,
      JSON.stringify(decor || {}),
      Date.now()
    );
  }
}

function activityFromRow(row) {
  return row.total_solved + row.total_pages_read + (row.study_minutes ?? 0) * 0.5;
}

export function updateStats(playerId, stats) {
  const result = dbConn.prepare(`
    UPDATE players 
    SET xp = ?, level = ?, total_solved = ?, total_pages_read = ?, 
        streak = ?, best_streak = ?, rank_label = ?, study_minutes = ?, updated_at = ?
    WHERE player_id = ?
  `).run(
    stats.xp,
    stats.level,
    stats.totalSolved,
    stats.totalPagesRead,
    stats.streak,
    stats.bestStreak,
    stats.rankLabel,
    stats.studyMinutes ?? 0,
    Date.now(),
    playerId
  );
  return result.changes > 0;
}

export function getPlayer(playerId) {
  return dbConn.prepare("SELECT * FROM players WHERE player_id = ?").get(playerId) || null;
}

export function getLeaderboard(sort = "activity") {
  const rows = dbConn.prepare("SELECT * FROM players").all();
  
  rows.sort((a, b) => {
    const actA = activityFromRow(a);
    const actB = activityFromRow(b);
    if (sort === "xp") return b.xp - a.xp || actB - actA;
    if (sort === "streak") return b.streak - a.streak || actB - actA;
    return actB - actA || b.xp - a.xp;
  });

  return rows.slice(0, 100).map((row, index) => ({
    rank: index + 1,
    playerId: row.player_id,
    displayName: row.display_name,
    decor: JSON.parse(row.decor_json || "{}"),
    xp: row.xp,
    level: row.level,
    totalSolved: row.total_solved,
    totalPagesRead: row.total_pages_read,
    activityTotal: activityFromRow(row),
    streak: row.streak,
    bestStreak: row.best_streak,
    rankLabel: row.rank_label,
    studyMinutes: row.study_minutes ?? 0,
    updatedAt: row.updated_at,
  }));
}
