import { motion, AnimatePresence } from "framer-motion";

export function MilestoneReveal({ milestone, onDismiss }) {
  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
        >
          <motion.div
            className="relative mx-4 max-w-sm text-center"
            initial={{ rotateY: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotateY: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 14, stiffness: 120 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="milestone-particles pointer-events-none absolute inset-0" />
            <div className="genz-glass glow-border rounded-3xl px-8 py-10">
              <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-300">Milestone</p>
              <h2 className="chroma-text mt-3 text-3xl font-bold">{milestone.label}</h2>
              <p className="mt-4 text-sm text-zinc-400">Unlocked · Keep grinding</p>
              <button
                type="button"
                onClick={onDismiss}
                className="mt-6 rounded-xl border border-white/10 bg-white/10 px-6 py-2 text-sm font-semibold text-white"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
