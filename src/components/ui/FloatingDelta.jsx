import { AnimatePresence, motion } from "framer-motion";

export function FloatingDelta({ deltas }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      <AnimatePresence>
        {deltas.map((d) => (
          <motion.span
            key={d.id}
            initial={{ opacity: 1, y: 0, x: d.x, scale: 1 }}
            animate={{ opacity: 0, y: -48, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute text-lg font-bold text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]"
            style={{ left: `calc(50% + ${d.x}px)`, top: "40%" }}
          >
            +{d.amount}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}
