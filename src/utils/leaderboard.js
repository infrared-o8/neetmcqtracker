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
  if (!selfPlayerId || !local) return players;

  // 1. Enrich data
  const enriched = players.map((p) => {
    if (p.playerId !== selfPlayerId) {
      const studyMinutes = readStudyMinutes(p);
      return {
        ...p,
        studyMinutes,
        activityTotal: getActivityTotal(p.totalSolved, p.totalPagesRead, studyMinutes),
      };
    }
    const studyMinutes = Math.max(readStudyMinutes(p), local.studyMinutes ?? 0);
    return {
      ...p,
      studyMinutes,
      activityTotal: getActivityTotal(
        p.totalSolved ?? local.totalSolved,
        p.totalPagesRead ?? local.totalPagesRead,
        studyMinutes,
      ),
    };
  });

  // 2. Re-sort based on new activity totals (Primary: Activity, Secondary: Study Minutes)
  enriched.sort((a, b) => {
    if (b.activityTotal !== a.activityTotal) {
      return b.activityTotal - a.activityTotal;
    }
    return (b.studyMinutes || 0) - (a.studyMinutes || 0);
  });

  // 3. Re-assign ranks based on sorted position
  return enriched.map((p, index) => ({
    ...p,
    rank: index + 1,
  }));
}
