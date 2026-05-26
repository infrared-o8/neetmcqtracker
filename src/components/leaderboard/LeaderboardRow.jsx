import { Crown } from "lucide-react";
import { FRAMES, DEFAULT_DECOR } from "../../data/profileDecor";

export function LeaderboardRow({
  player,
  isSelf,
  isFirst,
  showHoverHint,
  onHover,
  onLeave,
  onOpenProfile,
}) {
  const decor = { ...DEFAULT_DECOR, ...(player.decor || {}) };
  const frame = FRAMES[decor.frameId] || FRAMES['c1'] || { border: '', glow: '' };

  return (
    <tr
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onOpenProfile}
      className={`leaderboard-row group cursor-pointer border-b border-white/5 transition ${
        player.rank === 1 ? "rank-one-row" : 
        player.rank === 2 ? "rank-two-row" : 
        player.rank === 3 ? "rank-three-row" : ""
      } ${isSelf ? "bg-fuchsia-500/10" : "hover:bg-violet-500/8"} ${
        showHoverHint ? "leaderboard-row-hint" : ""
      }`}
    >
      <td className="px-3 py-3 text-center">
        {player.rank === 1 ? (
          <span className="rank-one-crown inline-flex items-center gap-1 text-amber-300">
            <Crown className="h-4 w-4" />
            <span className="font-bold">1</span>
          </span>
        ) : player.rank === 2 ? (
          <span className="inline-flex items-center gap-1 text-slate-300">
            <Crown className="h-4 w-4 opacity-70" />
            <span className="font-bold text-sm">2</span>
          </span>
        ) : player.rank === 3 ? (
          <span className="inline-flex items-center gap-1 text-orange-400/80">
            <Crown className="h-4 w-4 opacity-50" />
            <span className="font-bold text-sm">3</span>
          </span>
        ) : (
          <span className="text-sm font-bold text-zinc-500">#{player.rank}</span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-lg ${frame.border} ${frame.glow}`}
            style={{ borderColor: decor.accent ? `${decor.accent}88` : undefined }}
          >
            {decor.avatarEmoji || "📚"}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">
              {player.displayName}
              {isSelf && <span className="ml-1 text-[10px] text-fuchsia-300">(you)</span>}
            </p>
            <p className="truncate text-xs text-zinc-500">{player.rankLabel}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-sm font-bold text-white">
        {player.activityTotal?.toLocaleString() ?? 0}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-sm font-semibold text-cyan-200">
        {player.totalSolved?.toLocaleString() ?? 0}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-sm font-semibold text-violet-200">
        {player.totalPagesRead?.toLocaleString() ?? 0}
      </td>
      <td className="hidden px-3 py-3 text-right text-sm text-zinc-400 sm:table-cell">
        {player.streak}d
      </td>
      <td className="px-3 py-3 text-right text-sm font-semibold tabular-nums text-emerald-300/90">
        {Number(player.studyMinutes ?? 0)}m
      </td>
    </tr>
  );
}
