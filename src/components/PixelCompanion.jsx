import { motion } from "framer-motion";

const STATES = {
  sleeping: { emoji: "😴", label: "Resting" },
  reading: { emoji: "📖", label: "Studying" },
  celebrating: { emoji: "🎉", label: "Goal met!" },
};

export function PixelCompanion({ progressPercent }) {
  const state =
    progressPercent >= 100 ? "celebrating" : progressPercent >= 30 ? "reading" : "sleeping";
  const { emoji, label } = STATES[state];

  return (
    <div className="mt-4 flex flex-col items-center rounded-2xl border border-white/5 bg-zinc-900/40 p-3">
      <motion.span
        key={state}
        className="text-3xl"
        animate={{ y: state === "celebrating" ? [0, -4, 0] : 0 }}
        transition={{ repeat: state === "celebrating" ? Infinity : 0, duration: 0.6 }}
      >
        {emoji}
      </motion.span>
      <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>
    </div>
  );
}
