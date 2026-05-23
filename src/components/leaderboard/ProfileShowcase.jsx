import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { BANNERS, FRAMES } from "../../data/profileDecor";

export function ProfileShowcase({ player, anchorRect, onClose }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  if (!player || !anchorRect) return null;

  const decor = player.decor || {};
  const banner = BANNERS[decor.bannerId] || BANNERS.nebula;
  const frame = FRAMES[decor.frameId] || FRAMES.rare;
  const left = Math.min(anchorRect.left, window.innerWidth - 320);
  const top = anchorRect.bottom + 8;

  const content = (
    <motion.div
      ref={ref}
      className="fixed z-[200] w-[300px]"
      style={{ left, top }}
      initial={{ opacity: 0, scale: 0.85, rotateY: -25 }}
      animate={{ opacity: 1, scale: 1, rotateY: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onMouseLeave={onClose}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setTilt({
          x: ((e.clientX - r.left) / r.width - 0.5) * 16,
          y: ((e.clientY - r.top) / r.height - 0.5) * -16,
        });
      }}
    >
      <div
        className={`showcase-card overflow-hidden rounded-2xl border-2 ${frame.border} ${frame.glow}`}
        style={{
          transform: `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          background: banner,
        }}
      >
        <div className="showcase-sheen pointer-events-none absolute inset-0" />
        <div className="showcase-particles pointer-events-none absolute inset-0" />
        <div className="relative bg-black/50 p-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-black/40 text-2xl"
              style={{ boxShadow: `0 0 20px ${decor.accent || "#a855f7"}55` }}
            >
              {decor.avatarEmoji || "📚"}
            </span>
            <div>
              <p className="text-lg font-bold text-white">{player.displayName}</p>
              {decor.titleId && (
                <p className="chroma-text text-xs font-semibold uppercase">{decor.titleId}</p>
              )}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div className="rounded-lg bg-white/10 py-2">
              <p className="text-zinc-400">Activity</p>
              <p className="font-bold text-white">{player.activityTotal?.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <p className="text-zinc-400">Rank</p>
              <p className="font-bold text-cyan-300">{player.rankLabel}</p>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <p className="text-zinc-400">MCQs</p>
              <p className="font-bold">{player.totalSolved?.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <p className="text-zinc-400">Pages</p>
              <p className="font-bold">{player.totalPagesRead?.toLocaleString()}</p>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-zinc-500">
            #{player.rank} · {player.streak}d streak · Lv.{player.level}
          </p>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
}
