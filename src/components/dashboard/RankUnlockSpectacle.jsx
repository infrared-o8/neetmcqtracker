import { AnimatePresence, motion } from "framer-motion";

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  angle: (i / 24) * 360,
  dist: 80 + (i % 5) * 28,
  delay: (i % 8) * 0.04,
}));

export function RankUnlockSpectacle({ active, rankLabel, pulseKey, onDismiss }) {
  return (
    <AnimatePresence>
      {active && (
        <>
          <motion.div
            key={`flash-${pulseKey}`}
            className="pointer-events-none fixed inset-0 z-[90] bg-gradient-to-b from-violet-500/25 via-fuchsia-500/10 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.4, 0] }}
            transition={{ duration: 1.2 }}
          />

          <motion.div
            className="pointer-events-none fixed inset-0 z-[91] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {PARTICLES.map((p) => (
              <motion.span
                key={`${pulseKey}-${p.id}`}
                className="absolute left-1/2 top-[28%] h-2 w-2 rounded-full bg-gradient-to-br from-fuchsia-300 to-cyan-300 shadow-[0_0_12px_rgba(232,121,249,0.9)]"
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos((p.angle * Math.PI) / 180) * p.dist,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.dist,
                  scale: [0, 1.2, 0],
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.4, delay: p.delay, ease: "easeOut" }}
              />
            ))}
          </motion.div>

          <motion.div
            className="fixed left-0 right-0 top-20 z-[95] mx-auto max-w-lg px-4"
            initial={{ y: -80, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 140 }}
          >
            <div className="rank-unlock-banner relative overflow-hidden rounded-2xl border border-fuchsia-400/40 px-6 py-5 text-center shadow-[0_0_60px_rgba(168,85,247,0.45)]">
              <div className="rank-unlock-shimmer pointer-events-none absolute inset-0" />
              <p className="relative text-[10px] font-bold uppercase tracking-[0.35em] text-fuchsia-300">
                Rank upgraded
              </p>
              <h2 className="relative chroma-text mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
                {rankLabel}
              </h2>
              <p className="relative mt-2 text-sm text-violet-200/80">
                New tier unlocked — the grind pays off.
              </p>
              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="relative mt-4 rounded-xl border border-white/20 bg-white/10 px-5 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                >
                  Continue
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
