import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "data");
const dbPath = join(dataDir, "players.json");

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

function load() {
  if (!existsSync(dbPath)) {
    return { players: {} };
  }
  try {
    return JSON.parse(readFileSync(dbPath, "utf8"));
  } catch {
    return { players: {} };
  }
}

function save(data) {
  writeFileSync(dbPath, JSON.stringify(data, null, 2), "utf8");
}

export const db = { name: dbPath };

export function upsertPlayer({ playerId, displayName, decor }) {
  const data = load();
  const existing = data.players[playerId] || {
    player_id: playerId,
    xp: 0,
    level: 1,
    total_solved: 0,
    total_pages_read: 0,
    streak: 0,
    best_streak: 0,
    rank_label: "Beginner",
    study_minutes: 0,
  };
  data.players[playerId] = {
    ...existing,
    player_id: playerId,
    display_name: displayName,
    decor_json: JSON.stringify(decor || {}),
    updated_at: Date.now(),
  };
  save(data);
}

function activityFromRow(row) {
  return row.total_solved + row.total_pages_read + (row.study_minutes ?? 0) * 0.5;
}

export function updateStats(playerId, stats) {
  const data = load();
  if (!data.players[playerId]) return false;
  data.players[playerId] = {
    ...data.players[playerId],
    xp: stats.xp,
    level: stats.level,
    total_solved: stats.totalSolved,
    total_pages_read: stats.totalPagesRead,
    streak: stats.streak,
    best_streak: stats.bestStreak,
    rank_label: stats.rankLabel,
    study_minutes:
      stats.studyMinutes != null
        ? Number(stats.studyMinutes) || 0
        : (data.players[playerId].study_minutes ?? 0),
    updated_at: Date.now(),
  };
  save(data);
  return true;
}

export function getPlayer(playerId) {
  const data = load();
  return data.players[playerId] ?? null;
}

export function getLeaderboard(sort = "activity") {
  const data = load();
  const rows = Object.values(data.players);
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
