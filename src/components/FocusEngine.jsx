import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Play, Pause, RotateCcw, Shield, EyeOff, CheckCircle2, Coffee, Zap, Settings2, Plus, Minus } from "lucide-react";
import { useTrackerStore } from "../store/useTrackerStore";

/**
 * Rolling Slot-Machine Ticker for Numbers
 */
function RollingTicker({ value }) {
  const digits = value.toString().padStart(2, "0").split("");

  return (
    <div className="flex gap-1 overflow-hidden h-[1.2em] items-center font-mono text-6xl font-black tracking-tighter text-white">
      {digits.map((digit, idx) => (
        <div key={`${idx}-${digit}`} className="relative h-full w-[0.65em]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={digit}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

/**
 * Mechanical Keyboard Switch Style Button
 */
function MechanicalButton({ onClick, children, active = false, className = "", variant = "indigo" }) {
  const bgColor = variant === "orange" ? "bg-orange-500" : "bg-indigo-600";

  return (
    <button
      onClick={onClick}
      className={`group relative rounded-xl border-2 border-black ${bgColor} px-4 py-3 transition-all active:translate-y-[4px] active:shadow-none hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#000] shadow-[0_4px_0_0_#000] ${className}`}
      style={{ boxShadow: active ? "none" : `0 4px 0 0 #000`, transform: active ? "translateY(4px)" : "" }}
    >
      <div className="flex items-center gap-2 font-black uppercase tracking-widest text-white text-[10px]">
        {children}
      </div>
    </button>
  );
}

/**
 * iPhone-inspired Settings Panel
 */
function SettingsPanel({ focusMinutes, breakMinutes, onUpdateFocus, onUpdateBreak }) {
  return (
    <div className="flex flex-col gap-6 border-r border-white/5 pr-6 min-w-[180px]">
      <div className="flex items-center gap-2 text-zinc-500">
        <Settings2 className="h-3 w-3" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Config Deck</span>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">Focus Block</p>
          <div className="flex items-center justify-between">
            <button onClick={() => onUpdateFocus(focusMinutes - 1)} className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition">
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-xl font-black text-white">{focusMinutes}m</span>
            <button onClick={() => onUpdateFocus(focusMinutes + 1)} className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-3">Recharge Block</p>
          <div className="flex items-center justify-between">
            <button onClick={() => onUpdateBreak(breakMinutes - 1)} className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition">
              <Minus className="h-3 w-3" />
            </button>
            <span className="text-xl font-black text-white">{breakMinutes}m</span>
            <button onClick={() => onUpdateBreak(breakMinutes + 1)} className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition">
              <Plus className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Full-screen Peripheral Breathing Overlay
 */
function VignetteOverlay({ active, isBreak, isAntiStrain }) {
  if (!active || isAntiStrain) return null;
  
  return (
    <div 
      className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-1000 ${
        isBreak ? "animate-breathe-break opacity-100" : "animate-breathe opacity-100"
      }`}
    />
  );
}

/**
 * Minimalist Underline-Influenced History Component
 */
function SessionHistory({ history }) {
  return (
    <div className="flex flex-col gap-4 border-l border-white/5 pl-6 min-w-[180px]">
      <div className="flex items-center gap-2 text-zinc-500">
        <CheckCircle2 className="h-3 w-3" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Log Stream</span>
      </div>
      
      <div className="flex flex-col gap-3">
        {history.length === 0 && (
          <p className="text-[10px] text-zinc-600 italic">No logs found</p>
        )}
        {history.slice(0, 5).map((session) => (
          <div key={session.id} className="group relative">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold ${session.type === 'focus' ? 'text-indigo-300' : 'text-orange-300'}`}>
                {session.type === 'focus' ? 'FOCUS' : 'BREAK'}
              </span>
              <span className="text-[9px] font-mono text-zinc-600">
                {session.duration}m
              </span>
            </div>
            {/* The "Underline" influenced element */}
            <div className={`mt-1 h-[2px] w-full origin-left bg-gradient-to-r transition-transform duration-500 scale-x-50 group-hover:scale-x-100 ${
              session.type === 'focus' ? 'from-indigo-500/40 to-transparent' : 'from-orange-500/40 to-transparent'
            }`} />
          </div>
        ))}
      </div>

      {history.length > 5 && (
        <p className="text-[8px] text-zinc-700 uppercase tracking-tighter">+{history.length - 5} more sessions</p>
      )}
    </div>
  );
}

export function FocusEngine() {
  const preferences = useTrackerStore((s) => s.preferences);
  const setPreferences = useTrackerStore((s) => s.setPreferences);
  const addStudyMinute = useTrackerStore((s) => s.addStudyMinute);
  const addPomodoroSession = useTrackerStore((s) => s.addPomodoroSession);
  const pomodoroHistory = useTrackerStore((s) => s.pomodoroHistory);
  
  const focusMinutes = preferences.pomodoroFocusMinutes || 25;
  const breakMinutes = preferences.pomodoroBreakMinutes || 5;

  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [isAntiStrain, setIsAntiStrain] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);
  const [elapsedThisMinute, setElapsedThisMinute] = useState(0);

  const timerRef = useRef(null);

  // Sync timer when settings change and timer is NOT active
  useEffect(() => {
    if (!isActive) {
      setSecondsLeft((isBreak ? breakMinutes : focusMinutes) * 60);
    }
  }, [focusMinutes, breakMinutes, isBreak, isActive]);

  const triggerConfetti = useCallback(() => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  const resetTimer = (mins) => {
    setIsActive(false);
    setSecondsLeft(mins * 60);
    setElapsedThisMinute(0);
  };

  const toggleTimer = () => setIsActive(!isActive);

  const enterBreak = useCallback(() => {
    addPomodoroSession({ type: 'focus', duration: focusMinutes });
    setIsBreak(true);
    setIsActive(false);
    setSecondsLeft(breakMinutes * 60);
    setElapsedThisMinute(0);
  }, [addPomodoroSession, focusMinutes, breakMinutes]);

  const exitBreak = useCallback(() => {
    addPomodoroSession({ type: 'break', duration: breakMinutes });
    setIsBreak(false);
    setIsActive(false);
    setSecondsLeft(focusMinutes * 60);
    setElapsedThisMinute(0);
  }, [addPomodoroSession, focusMinutes, breakMinutes]);

  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            triggerConfetti();
            if (!isBreak) enterBreak();
            else exitBreak();
            return 0;
          }
          return prev - 1;
        });

        if (!isBreak) {
          setElapsedThisMinute((prev) => {
            if (prev >= 59) {
              addStudyMinute(); // Adds 0.5 AP via gamification logic
              return 0;
            }
            return prev + 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isActive, isBreak, addStudyMinute, enterBreak, exitBreak, triggerConfetti]);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === "Escape") {
        e.preventDefault();
        if (isBreak) exitBreak();
        else enterBreak();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBreak, enterBreak, exitBreak]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const containerClass = `relative flex flex-col md:flex-row gap-8 overflow-hidden rounded-3xl p-6 transition-all duration-700 ${
    isAntiStrain 
      ? "bg-zinc-950 border-zinc-800" 
      : isBreak 
        ? "bg-orange-950/20 border-orange-500/20 shadow-[0_0_40px_rgba(249,115,22,0.1)]" 
        : "bg-indigo-950/20 border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)]"
  } perf-glass border`;

  return (
    <>
      <VignetteOverlay active={isActive} isBreak={isBreak} isAntiStrain={isAntiStrain} />
      
      <div className={containerClass}>
        {/* Settings Side Panel */}
        <SettingsPanel 
          focusMinutes={focusMinutes} 
          breakMinutes={breakMinutes}
          onUpdateFocus={(val) => setPreferences({ pomodoroFocusMinutes: Math.max(1, val) })}
          onUpdateBreak={(val) => setPreferences({ pomodoroBreakMinutes: Math.max(1, val) })}
        />

        {/* Main Focus Area */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${isActive ? "animate-pulse " + (isBreak ? "bg-orange-400" : "bg-indigo-400") : "bg-zinc-600"}`} />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                {isBreak ? "Recharge Phase" : "Neural Focus"}
              </span>
            </div>
            
            <button 
              onClick={() => setIsAntiStrain(!isAntiStrain)}
              className={`p-2 rounded-lg transition-colors ${isAntiStrain ? "bg-zinc-800 text-zinc-200" : "bg-white/5 text-zinc-500 hover:text-zinc-300"}`}
              title="Anti-Strain Mode"
            >
              {isAntiStrain ? <EyeOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="flex items-center gap-4 select-none">
              <RollingTicker value={mins} />
              <span className={`text-4xl font-black text-zinc-800 ${isAntiStrain ? "text-zinc-700" : ""}`}>:</span>
              <RollingTicker value={secs} />
            </div>
            
            <p className="mt-4 text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
              {isActive ? (isBreak ? "Absorbing energy..." : "Deep work protocol active") : "Ready for next cycle"}
            </p>
          </div>

          <div className="mt-10 flex items-center justify-center gap-4">
            <MechanicalButton onClick={toggleTimer} active={isActive} variant={isBreak ? "orange" : "indigo"}>
              {isActive ? (
                <>
                  <Pause className="h-3 w-3 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 fill-current" /> Focus
                </>
              )}
            </MechanicalButton>

            <MechanicalButton onClick={() => resetTimer(isBreak ? breakMinutes : focusMinutes)} variant="indigo" className="bg-zinc-800 border-zinc-900 shadow-[0_4px_0_0_#000]">
              <RotateCcw className="h-3 w-3" /> Reset
            </MechanicalButton>

            <button 
              onClick={isBreak ? exitBreak : enterBreak}
              className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-colors px-2 ${
                isBreak ? 'text-zinc-500 hover:text-indigo-400' : 'text-zinc-500 hover:text-orange-400'
              }`}
            >
              {isBreak ? (
                <>Focus <Zap className="h-2 w-2" /></>
              ) : (
                <>Break <Coffee className="h-2 w-2" /></>
              )}
            </button>
          </div>
        </div>

        {/* History Side Panel */}
        <SessionHistory history={pomodoroHistory} />

        {/* Accessibility ARIA updates */}
        <div className="sr-only" aria-live="polite">
          Timer is {isActive ? "running" : "paused"}. {mins} minutes and {secs} seconds remaining.
        </div>
      </div>
    </>
  );
}
