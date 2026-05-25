import { motion, AnimatePresence } from "framer-motion";
import { useTrackerStore } from "../../store/useTrackerStore";

export function GlowCard({ 
  glow = false, 
  className = "", 
  children, 
  perf = false,
  id,
  minimized = false,
  onToggleMinimize,
  title // Used as label in minimized state
}) {
  const preferences = useTrackerStore((s) => s.preferences);
  const { reduceGpuUsage, uiOptimized } = preferences;
  const isGlowEnabled = glow && !reduceGpuUsage;
  const usePerfGlass = perf || reduceGpuUsage || uiOptimized;
  const isFullHeight = className.includes("h-full");

  return (
    <div
      className={`${usePerfGlass ? "perf-glass" : "genz-glass"} relative overflow-hidden rounded-3xl transition-[background-color,border-color,box-shadow,filter,opacity] duration-500 ${isGlowEnabled ? "glow-border animate-glow-pulse" : ""} ${className} ${minimized ? "min-h-[32px]" : "flex flex-col"}`}
    >
      {!uiOptimized && !reduceGpuUsage && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      )}
      {/* Minimize Toggle - Absolute Positioned & Centered */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleMinimize?.(id);
        }}
        className={`absolute right-4 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-white/5 text-[12px] text-zinc-500 transition-all hover:bg-white/10 hover:text-zinc-300 focus:opacity-100 ${
          minimized ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        title={minimized ? "Expand" : "Minimize"}
      >
        {minimized ? "+" : "−"}
      </button>

      <AnimatePresence initial={false}>
        {minimized ? (
          <motion.div
            key="minimized"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-8 items-center px-4 cursor-pointer"
            onClick={() => onToggleMinimize?.(id)}
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500 truncate pr-6">
              {title || id}
            </p>
          </motion.div>
        ) : (
          <div
            key="expanded"
            className={`group flex-1 flex flex-col overflow-hidden ${isFullHeight ? "h-full" : ""}`}
          >
            <div className={`p-5 flex-1 flex flex-col ${isFullHeight ? "h-full overflow-y-auto custom-scrollbar" : ""}`}>
              {children}
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
