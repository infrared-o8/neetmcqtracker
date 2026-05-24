import { GlowCard } from "../ui/GlowCard";

export function SpeedCard({ 
  currentSpeed, 
  speedLabel, 
  velocityTarget, 
  setVelocityTarget, 
  bestMomentumChain,
  id,
  minimized,
  onToggleMinimize
}) {
  const isBumping = currentSpeed > 0;
  const isMeetingTarget = velocityTarget > 0 && currentSpeed >= velocityTarget;

  let speedTheme = "speed-outline-amber speed-glow-amber";
  if (currentSpeed >= 120) speedTheme = "speed-outline-fire speed-glow-fire";
  else if (isMeetingTarget) speedTheme = "speed-outline-cyan speed-glow-cyan";
  else if (currentSpeed > 0) speedTheme = "speed-outline-rose";

  return (
    <div className={`group speed-highlight-wrap ${speedTheme} ${isBumping ? "speed-bump" : ""}`}>
      <GlowCard 
        id={id}
        minimized={minimized}
        onToggleMinimize={onToggleMinimize}
        title={`Velocity · ${speedLabel}`}
        className="relative z-[1]"
      >
        <p className="mt-2 text-4xl font-semibold text-white transition-transform group-hover:scale-110">
          {currentSpeed}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/5 pt-2">
          <div className="flex-1">
            <label className="text-[10px] text-zinc-500">Target</label>
            <input
              type="number"
              step={10}
              value={velocityTarget}
              onChange={(e) => setVelocityTarget(Number(e.target.value || 0))}
              className="mt-0.5 w-full bg-transparent text-xs font-medium text-zinc-300 outline-none"
            />
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500">Peak</p>
            <p className="text-xs font-medium text-orange-200">{bestMomentumChain}</p>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}
