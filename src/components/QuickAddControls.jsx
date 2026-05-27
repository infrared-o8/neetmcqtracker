import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Zap } from "lucide-react";
import { MagneticButton } from "./ui/MagneticButton";
import { FloatingDelta } from "./ui/FloatingDelta";
import { useSpacebarAdd } from "../hooks/useSpacebarAdd";
import { useThock } from "../hooks/useThock";

export function QuickAddControls({ onAdd, label = "MCQ", showCombo = false, comboCount = 0 }) {
  const [deltas, setDeltas] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const playThock = useThock();

  const fire = useCallback(
    (amount) => {
      playThock();
      onAdd(amount);
      const id = `${Date.now()}-${Math.random()}`;
      setDeltas((d) => [...d, { id, amount, x: (Math.random() - 0.5) * 24 }]);
      setTimeout(() => {
        setDeltas((d) => d.filter((x) => x.id !== id));
      }, 650);
    },
    [onAdd, playThock],
  );

  useSpacebarAdd(() => fire(1));

  return (
    <>
      {/* Desktop View (In-Grid) */}
      <div className="hidden md:flex flex-col items-center gap-4">
        <FloatingDelta deltas={deltas} />
        <motion.button
          onClick={() => fire(1)}
          whileTap={{ scale: 0.95 }}
          className="group relative flex h-28 w-28 items-center justify-center rounded-full border border-fuchsia-300/30 bg-gradient-to-br from-fuchsia-500/80 to-cyan-500/80 text-5xl font-semibold text-white shadow-[0_0_50px_rgba(168,85,247,0.45)]"
        >
          <span className="relative z-10">+</span>
        </motion.button>
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400">
          Tap, Space, or +5 · {label}
        </p>
        <div className="flex gap-2">
          {[1, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => fire(n)}
              className="rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/15"
            >
              +{n}
            </button>
          ))}
        </div>
        {showCombo && comboCount >= 2 && (
          <span className="combo-badge">Combo ×{Math.min(comboCount, 99)}</span>
        )}
      </div>

      {/* Mobile FAB View */}
      <div className="md:hidden">
        <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
          <FloatingDelta deltas={deltas} />
          
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                className="flex flex-col gap-3 mb-2"
              >
                <button
                  onClick={() => { fire(5); setIsOpen(false); }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 border border-fuchsia-500/30 text-fuchsia-400 shadow-xl active:scale-95 transition-transform"
                >
                  <span className="text-lg font-black">+5</span>
                </button>
                <button
                  onClick={() => { fire(1); setIsOpen(false); }}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 border border-cyan-500/30 text-cyan-400 shadow-xl active:scale-95 transition-transform"
                >
                  <span className="text-lg font-black">+1</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-indigo-600 text-white shadow-2xl shadow-fuchsia-500/40 transition-transform active:scale-90 ${isOpen ? 'rotate-45' : ''}`}
          >
            <Plus className="h-8 w-8" />
            {showCombo && comboCount >= 2 && (
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -left-1 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-[10px] font-black shadow-lg"
              >
                {Math.min(comboCount, 99)}
              </motion.div>
            )}
          </button>
        </div>
        
        {/* Placeholder in grid to maintain layout structure if needed, but we'll likely hide it in BentoDashboard */}
        <div className="flex flex-col items-center justify-center h-full p-4 border border-dashed border-white/5 rounded-3xl bg-white/5 opacity-50">
          <Zap className="h-5 w-5 text-zinc-600 mb-2" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Quick Add Active (FAB)</p>
        </div>
      </div>
    </>
  );
}
