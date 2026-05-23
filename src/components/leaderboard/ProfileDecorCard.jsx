import { BANNERS, FRAMES, DEFAULT_DECOR } from "../../data/profileDecor";

const BANNER_NAMES = {
  nebula: "Nebula",
  synthwave: "Synthwave",
  biohazard: "Biohazard",
  monsoon: "Monsoon",
  "gold-rift": "Gold Rift",
};

/** Full profile decor preview — matches Settings layout. */
export function ProfileDecorCard({ player, compact = false }) {
  const decor = { ...DEFAULT_DECOR, ...(player?.decor || {}) };
  const banner = BANNERS[decor.bannerId] || BANNERS.nebula;
  const frame = FRAMES[decor.frameId] || FRAMES.rare;
  const bannerName = BANNER_NAMES[decor.bannerId] || decor.bannerId;

  return (
    <div className={`overflow-hidden rounded-2xl border-2 ${frame.border} ${frame.glow}`}>
      <div className="relative h-28 w-full" style={{ background: banner }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute bottom-3 left-3 flex items-end gap-3">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white/25 bg-black/50 text-3xl shadow-lg"
            style={{ boxShadow: `0 0 24px ${decor.accent}66` }}
          >
            {decor.avatarEmoji || "📚"}
          </span>
          <div>
            <p className="text-lg font-bold text-white">{player?.displayName || "Aspirant"}</p>
            {decor.titleId ? (
              <p className="chroma-text text-xs font-bold uppercase tracking-wider">{decor.titleId}</p>
            ) : (
              <p className="text-xs text-zinc-500">No title equipped</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-zinc-950/90 p-4 backdrop-blur-md">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
            <p className="text-zinc-500">Banner</p>
            <p className="font-semibold text-violet-200">{bannerName}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
            <p className="text-zinc-500">Frame</p>
            <p className="font-semibold capitalize text-cyan-200">{decor.frameId}</p>
          </div>
        </div>

        {!compact && (
          <>
            <div className="flex items-center gap-2">
              <p className="text-[10px] uppercase text-zinc-500">Accent</p>
              <span
                className="h-6 w-6 rounded-full border-2 border-white/30"
                style={{ background: decor.accent }}
              />
              <span className="font-mono text-xs text-zinc-400">{decor.accent}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <Stat label="MCQs" value={player?.totalSolved} />
              <Stat label="Pages" value={player?.totalPagesRead} />
              <Stat label="Activity" value={player?.activityTotal} />
              <Stat label="Study min" value={player?.studyMinutes} />
              <Stat label="Streak" value={`${player?.streak ?? 0}d`} />
              <Stat label="Level" value={player?.level} />
            </div>
            <p className="text-center text-[10px] text-zinc-500">
              Tier: {player?.rankLabel} · #{player?.rank}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg bg-white/5 py-2">
      <p className="text-zinc-500">{label}</p>
      <p className="font-bold text-white">{value?.toLocaleString?.() ?? value ?? "—"}</p>
    </div>
  );
}
