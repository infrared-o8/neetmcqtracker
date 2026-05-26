import { useCallback, useMemo, useState } from "react";
import { LeaderboardRow } from "./LeaderboardRow";
import { ProfileShowcase } from "./ProfileShowcase";
import { useProfileStore } from "../../store/useProfileStore";
import { useTrackerStore } from "../../store/useTrackerStore";
import { DEFAULT_DECOR } from "../../data/profileDecor";
import { enrichLeaderboardPlayers } from "../../utils/leaderboard";

export function LeaderboardTable({ players, selfPlayerId, liveFlash }) {
  const localDecor = useProfileStore((s) => s.decor);
  const localName = useProfileStore((s) => s.displayName);
  const localStudyMinutes = useTrackerStore((s) => s.studyMinutes);
  const localTotalSolved = useTrackerStore((s) => s.totalSolved);
  const localTotalPagesRead = useTrackerStore((s) => s.totalPagesRead);
  const [hoveredId, setHoveredId] = useState(null);
  const [selected, setSelected] = useState(null);

  const displayPlayers = useMemo(
    () =>
      enrichLeaderboardPlayers(players, selfPlayerId, {
        studyMinutes: localStudyMinutes,
        totalSolved: localTotalSolved,
        totalPagesRead: localTotalPagesRead,
      }),
    [players, selfPlayerId, localStudyMinutes, localTotalSolved, localTotalPagesRead],
  );

  const enrichPlayer = useCallback(
    (player) => {
      const merged =
        displayPlayers.find((p) => p.playerId === player.playerId) ?? player;
      if (merged.playerId !== selfPlayerId) return merged;
      return {
        ...merged,
        displayName: localName || merged.displayName,
        decor: { ...DEFAULT_DECOR, ...merged.decor, ...localDecor },
      };
    },
    [displayPlayers, selfPlayerId, localDecor, localName],
  );

  const openProfile = (player) => {
    setSelected(enrichPlayer(player));
  };

  return (
    <>
      <div
        className={`genz-glass overflow-hidden rounded-2xl transition ${liveFlash ? "live-stats-flash" : ""}`}
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-zinc-900/60 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              <th className="px-3 py-3 text-center">#</th>
              <th className="px-3 py-3">Player</th>
              <th className="px-3 py-3 text-right">Activity</th>
              <th className="px-3 py-3 text-right">MCQs</th>
              <th className="px-3 py-3 text-right">Pages</th>
              <th className="hidden px-3 py-3 text-right sm:table-cell">Streak</th>
              <th className="px-3 py-3 text-right">Study</th>
            </tr>
          </thead>
          <tbody>
            {displayPlayers.map((p) => (
              <LeaderboardRow
                key={p.playerId}
                player={p}
                isSelf={p.playerId === selfPlayerId}
                isFirst={p.rank === 1}
                showHoverHint={hoveredId === p.playerId}
                onHover={() => setHoveredId(p.playerId)}
                onLeave={() => setHoveredId((id) => (id === p.playerId ? null : id))}
                onOpenProfile={() => openProfile(p)}
              />
            ))}
          </tbody>
        </table>
        {displayPlayers.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">No players on the board yet.</p>
        )}
      </div>

      <ProfileShowcase
        player={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
