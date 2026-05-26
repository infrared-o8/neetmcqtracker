import { getActivityTotal } from "./gamification";

/** Normalize study minutes from API payloads (camelCase or snake_case). */
export function readStudyMinutes(player) {
  if (!player) return 0;
  const raw = player.studyMinutes ?? player.study_minutes;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

/** Merge local face-study stats for the signed-in player row. */
export function enrichLeaderboardPlayers(players, selfPlayerId, local) {
  if (!players || !Array.isArray(players)) return [];

  // 1. Enrichment pass
  const enriched = players.map((p) => {
    const isSelf = selfPlayerId && p.playerId === selfPlayerId;
    const l = isSelf && local ? local : {};

    // Robust field reading (handle possible case variations or missing keys)
    const sSolved = p.totalSolved ?? p.total_solved ?? 0;
    const sPages = p.totalPagesRead ?? p.total_pages_read ?? 0;
    const sMinutes = p.studyMinutes ?? p.study_minutes ?? 0;

    // Get the most advanced numbers available (Server vs Local)
    const totalSolved = Math.max(Number(sSolved) || 0, Number(l.totalSolved) || 0);
    const totalPagesRead = Math.max(Number(sPages) || 0, Number(l.totalPagesRead) || 0);
    const studyMinutes = Math.max(Number(sMinutes) || 0, Number(l.studyMinutes) || 0);

    return {
      ...p,
      totalSolved,
      totalPagesRead,
      studyMinutes,
      activityTotal: getActivityTotal(totalSolved, totalPagesRead, studyMinutes),
    };
  });

  // 2. Re-sort based on new activity totals
  enriched.sort((a, b) => {
    const aTotal = Number(a.activityTotal) || 0;
    const bTotal = Number(b.activityTotal) || 0;
    if (bTotal !== aTotal) return bTotal - aTotal;
    
    const aMin = Number(a.studyMinutes) || 0;
    const bMin = Number(b.studyMinutes) || 0;
    return bMin - aMin;
  });

  // 3. Re-assign ranks
  return enriched.map((p, index) => ({
    ...p,
    rank: index + 1,
  }));
}
