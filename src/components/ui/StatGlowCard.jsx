import { GlowCard } from "./GlowCard";
import { TiltCard } from "./TiltCard";

/**
 * Stat card with hover outline + rank-upgrade reactive glow.
 * @param {'cyan' | 'violet'} outline - accent for border glow
 */
export function StatGlowCard({
  outline = "cyan",
  rankPulse = false,
  goalGlow = false,
  className = "",
  children,
}) {
  const outlineClass = outline === "violet" ? "stat-outline-violet" : "stat-outline-cyan";

  return (
    <div
      className={`group stat-highlight-wrap ${outlineClass} ${rankPulse ? "stat-rank-pulse" : ""} ${className}`}
    >
      <GlowCard glow={goalGlow} className="relative z-[1] h-full">
        <TiltCard lowSheen>{children}</TiltCard>
      </GlowCard>
    </div>
  );
}
