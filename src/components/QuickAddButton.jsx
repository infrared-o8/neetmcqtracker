import { motion } from "framer-motion";

const MotionButton = motion.button;
const MotionSpan = motion.span;

export function QuickAddButton({ onAdd }) {
  return (
    <MotionButton
      onClick={onAdd}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.24 }}
      className="group relative mx-auto mt-4 flex h-24 w-24 min-h-16 min-w-16 items-center justify-center rounded-full border border-fuchsia-300/30 bg-gradient-to-br from-fuchsia-500/80 to-cyan-500/80 text-5xl font-semibold text-white shadow-[0_0_50px_rgba(168,85,247,0.45)] md:mt-6 md:h-36 md:w-36 md:text-7xl"
    >
      <MotionSpan
        className="absolute inset-0 rounded-full border border-white/30"
        animate={{ scale: [1, 1.18, 1], opacity: [0.42, 0, 0.42] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <span className="relative z-10 select-none">+</span>
      <span className="pointer-events-none absolute -bottom-6 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-300 md:-bottom-8 md:text-xs md:tracking-[0.3em]">
        Tap or Space
      </span>
    </MotionButton>
  );
}
