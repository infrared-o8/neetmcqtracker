import { GlowCard } from "../ui/GlowCard";
import { Zap, TrendingUp, Activity, RefreshCcw } from "lucide-react";
import { useTrackerStore } from "../../store/useTrackerStore";

export function SpeedCard({ 
  currentSpeed, 
  speedLabel, 
  velocityTarget, 
  setVelocityTarget, 
  bestMomentumChain,
  id,
  minimized,
  onToggleMinimize,
  className = ""
}) {
  const resetVelocity = useTrackerStore((s) => s.resetVelocity);
  const isMeetingTarget = velocityTarget > 0 && currentSpeed >= velocityTarget;
  const progress = Math.min((currentSpeed / (velocityTarget || 1)) * 100, 100);
  
  // Fake trend for visual (in real app, compare with previous state)
  const isTrendingUp = currentSpeed > 0;

  let speedTheme = "speed-outline-amber speed-glow-amber";
  let accentColor = "text-amber-400";
  let ringColor = "stroke-amber-500/30";
  let progressColor = "stroke-amber-400";

  if (currentSpeed >= 120) {
    speedTheme = "speed-outline-fire speed-glow-fire";
    accentColor = "text-fuchsia-400";
    progressColor = "stroke-fuchsia-500";
  } else if (isMeetingTarget) {
    speedTheme = "speed-outline-cyan speed-glow-cyan";
    accentColor = "text-cyan-400";
    progressColor = "stroke-cyan-400";
  } else if (currentSpeed > 0) {
    speedTheme = "speed-outline-rose";
    accentColor = "text-rose-400";
    progressColor = "stroke-rose-500";
  }

  return (
    <div className={`group speed-highlight-wrap h-full ${speedTheme} ${currentSpeed > 0 ? "speed-bump" : ""} ${className}`}>
      <GlowCard 
        id={id}
        minimized={minimized}
        onToggleMinimize={onToggleMinimize}
        title={`Velocity · ${speedLabel}`}
        className="relative z-[1] h-full"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className={`h-3 w-3 ${accentColor}`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Kinetic Engine</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); resetVelocity(); }}
            className="rounded-full bg-white/5 p-1.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300 transition-all"
            title="Reset Velocity"
          >
            <RefreshCcw className="h-3 w-3" />
          </button>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="relative h-20 w-20 shrink-0">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className={ringColor}
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className={`${progressColor} transition-all duration-1000`}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray="264"
                strokeDashoffset={264 - (264 * progress) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${accentColor}`}>{currentSpeed}</span>
              <span className="text-[8px] uppercase tracking-tighter text-zinc-500">MCQ/h</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${isTrendingUp ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
              {isTrendingUp ? <TrendingUp className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
              {isTrendingUp ? '+Active' : 'Steady'}
            </div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Status</p>
            <p className={`text-xs font-bold uppercase ${accentColor}`}>
              {currentSpeed >= 120 ? 'CRITICAL MASS' : isMeetingTarget ? 'GOAL HIT' : currentSpeed > 0 ? 'PUSHING' : 'IDLE'}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/5 pt-3">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-1">
              <Zap className="h-3 w-3 text-zinc-500" />
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest">Target</label>
            </div>
            <input
              type="number"
              step={10}
              value={velocityTarget}
              onChange={(e) => setVelocityTarget(Number(e.target.value || 0))}
              className="w-full bg-zinc-900/50 rounded-lg px-2 py-1 text-sm font-bold text-zinc-300 outline-none focus:ring-1 focus:ring-white/10"
            />
          </div>
          <div className="text-right border-l border-white/5 pl-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Peak</p>
            <p className="text-sm font-bold text-orange-400">{bestMomentumChain}</p>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}

