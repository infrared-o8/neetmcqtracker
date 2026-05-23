import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "../ui/GlowCard";
import { RollingNumber } from "../ui/RollingNumber";

function getSpeedZone(speed, target) {
  if (speed <= 0) return "idle";
  if (speed >= Math.max(target, 50)) return "blazing";
  if (speed >= target * 0.88) return "fast";
  if (speed >= 20) return "medium";
  return "slow";
}

const ZONE_STYLES = {
  idle: {
    label: "Idle",
    outline: "speed-outline-zinc",
    value: "text-zinc-300",
    glow: "",
  },
  slow: {
    label: "Warming up",
    outline: "speed-outline-rose",
    value: "text-rose-300",
    glow: "speed-glow-rose",
  },
  medium: {
    label: "Steady pace",
    outline: "speed-outline-amber",
    value: "text-amber-300",
    glow: "speed-glow-amber",
  },
  fast: {
    label: "On target",
    outline: "speed-outline-cyan",
    value: "text-cyan-300",
    glow: "speed-glow-cyan",
  },
  blazing: {
    label: "Blazing",
    outline: "speed-outline-fire",
    value: "text-fuchsia-300 chroma-text",
    glow: "speed-glow-fire",
  },
};

export function SpeedCard({
  currentSpeed,
  speedLabel,
  velocityTarget,
  setVelocityTarget,
  bestMomentumChain,
}) {
  const zone = getSpeedZone(currentSpeed, velocityTarget);
  const style = ZONE_STYLES[zone];
  const [bump, setBump] = useState(false);
  const prevSpeed = useRef(currentSpeed);

  useEffect(() => {
    if (currentSpeed > prevSpeed.current && currentSpeed > 0) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 700);
      prevSpeed.current = currentSpeed;
      return () => clearTimeout(t);
    }
    prevSpeed.current = currentSpeed;
  }, [currentSpeed]);

  const delta =
    velocityTarget > 0
      ? Math.round(((currentSpeed - velocityTarget) / velocityTarget) * 100)
      : 0;

  return (
    <div
      className={`bento-speed speed-highlight-wrap group ${style.outline} ${style.glow} ${bump ? "speed-bump" : ""}`}
    >
      <GlowCard className="relative h-full overflow-visible">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 transition-colors group-hover:text-cyan-200/80">
          Speed
        </p>
        <div className="mt-1 flex items-baseline gap-2">
          <motion.p
            className={`text-3xl font-bold tabular-nums ${style.value}`}
            animate={bump ? { scale: [1, 1.08, 1] } : {}}
            transition={{ duration: 0.35 }}
          >
            <RollingNumber value={currentSpeed} />
          </motion.p>
          <span className={`text-sm font-semibold uppercase tracking-wider ${style.value} opacity-90`}>
            {speedLabel}
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={style.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`mt-2 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              zone === "blazing"
                ? "border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-200"
                : zone === "fast"
                  ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-200"
                  : "border-white/10 bg-white/5 text-zinc-400"
            }`}
          >
            {style.label}
          </motion.p>
        </AnimatePresence>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${
              zone === "blazing"
                ? "from-fuchsia-500 via-violet-400 to-cyan-400"
                : zone === "fast"
                  ? "from-cyan-500 to-emerald-400"
                  : zone === "medium"
                    ? "from-amber-500 to-orange-400"
                    : "from-rose-500 to-amber-500"
            }`}
            animate={{
              width: `${Math.min((currentSpeed / Math.max(velocityTarget, 60)) * 100, 100)}%`,
            }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {delta !== 0 && velocityTarget > 0 && (
          <p className={`mt-2 text-xs font-medium ${delta >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
            {delta >= 0 ? `+${delta}% above target` : `${delta}% below target`}
          </p>
        )}

        <p className="mt-2 text-xs text-zinc-500">Best combo: {bestMomentumChain}</p>
        <label className="mt-2 block text-[10px] uppercase tracking-wider text-zinc-600">Velocity target</label>
        <input
          type="number"
          min={10}
          value={velocityTarget}
          onChange={(e) => setVelocityTarget(Number(e.target.value || 0))}
          className="mt-1 w-full rounded-lg border border-white/10 bg-zinc-900/60 px-2 py-1 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/30"
        />
      </GlowCard>
    </div>
  );
}
