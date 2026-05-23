import { useRef, useState } from "react";
import { FRAMES } from "../../data/profileDecor";
import { ProfileShowcase } from "./ProfileShowcase";

export function LeaderboardRow({ player, isSelf }) {
  const rowRef = useRef(null);
  const [showcase, setShowcase] = useState(null);
  const hoverTimer = useRef(null);
  const decor = player.decor || {};
  const frame = FRAMES[decor.frameId] || FRAMES.common;

  const onEnter = () => {
    hoverTimer.current = setTimeout(() => {
      const rect = rowRef.current?.getBoundingClientRect();
      if (rect) setShowcase(rect);
    }, 150);
  };

  const onLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };

  return (
    <>
      <div
        ref={rowRef}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
          isSelf
            ? "border-fuchsia-400/40 bg-fuchsia-500/10"
            : "border-white/5 bg-zinc-900/30 hover:border-violet-400/30 hover:bg-violet-500/5"
        } ${frame.glow}`}
      >
        <span className="w-8 text-center text-sm font-bold text-zinc-500">#{player.rank}</span>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg ${frame.border}`}
          style={{ borderColor: decor.accent ? `${decor.accent}66` : undefined }}
        >
          {decor.avatarEmoji || "📚"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">{player.displayName}</p>
          <p className="truncate text-xs text-zinc-500">{player.rankLabel}</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-violet-300">{player.activityTotal?.toLocaleString()}</p>
          <p className="text-[10px] text-zinc-500">{player.streak}d streak</p>
        </div>
      </div>
      {showcase && (
        <ProfileShowcase
          player={player}
          anchorRect={showcase}
          onClose={() => setShowcase(null)}
        />
      )}
    </>
  );
}
