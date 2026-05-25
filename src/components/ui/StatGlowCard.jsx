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
  perf = false,
  id,
  minimized = false,
  onToggleMinimize,
  title
}) {
  const outlineClass = outline === "violet" ? "stat-outline-violet" : "stat-outline-cyan";

  return (
    <div
      className={`group stat-highlight-wrap h-full ${outlineClass} ${rankPulse ? "stat-rank-pulse" : ""} ${className}`}
    >
      <GlowCard 
        glow={goalGlow} 
        perf={perf} 
        className="relative z-[1] h-full"
        id={id}
        minimized={minimized}
        onToggleMinimize={onToggleMinimize}
        title={title}
      >
        {children}
      </GlowCard>
    </div>
  );
}
