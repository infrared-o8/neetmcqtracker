import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { MagneticButton } from "./ui/MagneticButton";
import { FloatingDelta } from "./ui/FloatingDelta";
import { useSpacebarAdd } from "../hooks/useSpacebarAdd";
import { useThock } from "../hooks/useThock";

const MotionSpan = motion.span;

export function QuickAddControls({ onAdd, label = "MCQ", showCombo = false, comboCount = 0 }) {
  const [deltas, setDeltas] = useState([]);
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
    <div className="relative flex flex-col items-center gap-4">
      <FloatingDelta deltas={deltas} />
      <MagneticButton
        onClick={() => fire(1)}
        className="group relative flex h-28 w-28 items-center justify-center rounded-full border border-fuchsia-300/30 bg-gradient-to-br from-fuchsia-500/80 to-cyan-500/80 text-5xl font-semibold text-white shadow-[0_0_50px_rgba(168,85,247,0.45)] md:h-32 md:w-32"
      >
        <MotionSpan
          className="absolute inset-0 rounded-full border border-white/30"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
        <span className="relative z-10">+</span>
      </MagneticButton>
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
  );
}
