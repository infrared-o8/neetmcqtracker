import { useEffect } from "react";
import { GlowCard } from "../ui/GlowCard";
import { useFaceStudyContext } from "../../hooks/useFaceStudyContext";
import { useTrackerStore } from "../../store/useTrackerStore";

export function StudyCameraCard({ id, minimized, onToggleMinimize, className = "" }) {
  const studyMinutes = useTrackerStore((s) => s.studyMinutes);
  const studyMinutesToday = useTrackerStore((s) => s.studyMinutesToday);
  const showAiSelfView = useTrackerStore((s) => s.preferences.showAiSelfView);
  
  const {
    videoRef,
    active,
    loading,
    error,
    faceDetected,
    confidence,
    secondsTowardMinute,
    startCamera,
    stopCamera,
  } = useFaceStudyContext();

  // Removed auto-restart on mount

  return (
    <GlowCard 
      glow={active && faceDetected} 
      className={`bento-camera h-full ${className}`}
      id={id}
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
      title="Intelligent Study Camera"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
            AI · Focus monitoring active
          </p>
        </div>
        <div className="text-right text-[10px] text-zinc-500">
          <p>
            Today <span className="font-semibold text-emerald-300">{studyMinutesToday}m</span>
          </p>
          <p>
            Total <span className="text-zinc-400">{studyMinutes}m</span>
          </p>
        </div>
      </div>

      <div className={`relative mt-3 aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/80 ${!showAiSelfView && active ? 'opacity-20 grayscale grayscale-100' : ''}`}>
        <video
          ref={videoRef}
          className={`h-full w-full object-cover mirror-video ${active ? "" : "hidden"} ${!showAiSelfView ? "invisible absolute" : ""}`}
          playsInline
          muted
        />
        
        {!showAiSelfView && active && (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-zinc-900/40">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Sensors Active</p>
          </div>
        )}
        
        {!active && (
          <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="text-3xl opacity-60">📷</span>
            <p className="text-xs text-zinc-500">Earn minutes while you read</p>
          </div>
        )}
        {active && (
          <>
            <div
              className={`absolute left-3 top-3 rounded-lg px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm transition-colors ${
                faceDetected ? "bg-emerald-500/35 text-emerald-100" : "bg-zinc-900/80 text-zinc-400"
              }`}
            >
              {faceDetected ? `Face ${Math.round(confidence * 100)}%` : "No face"}
            </div>
          </>
        )}
        {active && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6">
            <div className="h-1 overflow-hidden rounded-full bg-zinc-700/80">
              <div
                className="h-full transition-all duration-300 bg-gradient-to-r from-cyan-500 to-emerald-400"
                style={{ width: `${(secondsTowardMinute / 60) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-center text-[10px] text-zinc-400">
              {secondsTowardMinute}s / 60s
            </p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}

      <button
        type="button"
        onClick={active ? stopCamera : startCamera}
        disabled={loading}
        className={`mt-3 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
          active
            ? "border border-rose-400/30 bg-rose-500/15 text-rose-200 hover:bg-rose-500/25"
            : "border border-cyan-400/30 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25"
        }`}
      >
        {loading ? "…" : active ? "Stop" : "Start"}
      </button>
    </GlowCard>
  );
}
