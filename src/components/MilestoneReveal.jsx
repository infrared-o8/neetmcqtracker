import { motion, AnimatePresence } from "framer-motion";

const SPARKS = Array.from({ length: 16 }, (_, i) => i);

export function MilestoneReveal({ milestone, onDismiss }) {
  const isRank = milestone?.id?.startsWith("rank-");

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.35),transparent_55%)]"
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <motion.div
            className="relative mx-4 w-full max-w-md text-center"
            initial={{ rotateY: 90, scale: 0.4, opacity: 0 }}
            animate={{ rotateY: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 11, stiffness: 100 }}
            onClick={(e) => e.stopPropagation()}
          >
            {SPARKS.map((i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-white"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: Math.cos((i / 16) * Math.PI * 2) * 140,
                  y: Math.sin((i / 16) * Math.PI * 2) * 140,
                  opacity: [0, 1, 0],
                }}
                transition={{ duration: 1.2, delay: i * 0.03 }}
              />
            ))}

            <div
              className={`relative overflow-hidden rounded-3xl border-2 px-8 py-10 ${
                isRank
                  ? "rank-reveal-card border-fuchsia-400/60 shadow-[0_0_80px_rgba(168,85,247,0.5)]"
                  : "genz-glass glow-border border-white/20"
              }`}
            >
              <div className="rank-unlock-shimmer pointer-events-none absolute inset-0 opacity-60" />
              <motion.p
                className="relative text-xs uppercase tracking-[0.35em] text-fuchsia-300"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                {isRank ? "Rank evolution" : "Milestone"}
              </motion.p>
              <motion.h2
                className="relative mt-4 text-4xl font-extrabold chroma-text"
                animate={isRank ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                {milestone.label}
              </motion.h2>
              <p className="relative mt-4 text-sm text-zinc-300">
                {isRank ? "You crossed a new competitive tier. Keep stacking." : "Unlocked · Keep grinding"}
              </p>
              <button
                type="button"
                onClick={onDismiss}
                className="relative mt-8 rounded-xl border border-fuchsia-400/40 bg-gradient-to-r from-fuchsia-600/80 to-violet-600/80 px-8 py-2.5 text-sm font-bold text-white shadow-[0_0_24px_rgba(168,85,247,0.4)]"
              >
                Claim glory
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
