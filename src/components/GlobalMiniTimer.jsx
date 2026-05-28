import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Coffee, Zap } from "lucide-react";
import { useTrackerStore } from "../store/useTrackerStore";

function formatTime(totalSeconds) {
  const w = Math.floor(totalSeconds / (7 * 24 * 3600));
  let rem = totalSeconds % (7 * 24 * 3600);
  const d = Math.floor(rem / (24 * 3600));
  rem = rem % (24 * 3600);
  const h = Math.floor(rem / 3600);
  rem = rem % 3600;
  const m = Math.floor(rem / 60);
  const s = rem % 60;
  
  const parts = [];
  if (w > 0) parts.push(`${w}w`);
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  return parts.join(" ");
}

export function GlobalMiniTimer() {
  const location = useLocation();
  const navigate = useNavigate();
  const pState = useTrackerStore(s => s.pomodoroState);
  const setPState = useTrackerStore(s => s.setPomodoroState);
  
  // Only show if not on dashboard, and if there's either an active timer or the user is in a break/paused state
  // Typically we show it everywhere except dashboard.
  const isDashboard = location.pathname === "/";

  if (isDashboard) return null;

  const toggleTimer = (e) => {
    e.stopPropagation();
    setPState({ isActive: !pState.isActive });
  };

  const skipToBreakOrFocus = (e) => {
    e.stopPropagation();
    const prefs = useTrackerStore.getState().preferences;
    if (pState.isBreak) {
      setPState({ isBreak: false, isActive: false, secondsLeft: (prefs.pomodoroFocusMinutes || 25) * 60 });
    } else {
      setPState({ isBreak: true, isActive: false, secondsLeft: (prefs.pomodoroBreakMinutes || 5) * 60 });
    }
  };

  const goHome = () => {
    navigate("/");
  };

  const bgColors = pState.isBreak 
    ? "bg-orange-950/80 border-orange-500/30 text-orange-200" 
    : "bg-indigo-950/80 border-indigo-500/30 text-indigo-200";

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        onClick={goHome}
        className={`fixed bottom-6 right-6 z-[100] flex cursor-pointer items-center gap-4 rounded-2xl border p-3 shadow-2xl backdrop-blur-xl transition-colors hover:bg-opacity-100 ${bgColors}`}
      >
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
            {pState.isBreak ? "Recharge" : "Focus"}
          </span>
          <span className="font-mono text-lg font-black tracking-tighter">
            {formatTime(pState.secondsLeft)}
          </span>
        </div>

        <div className="flex items-center gap-1 border-l border-white/10 pl-3">
          <button 
            onClick={toggleTimer}
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
          >
            {pState.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          
          <button 
            onClick={skipToBreakOrFocus}
            className="rounded-lg p-2 transition-colors hover:bg-white/10"
            title={pState.isBreak ? "Skip to Focus" : "Skip to Break"}
          >
            {pState.isBreak ? <Zap className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
