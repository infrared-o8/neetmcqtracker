import { motion } from "framer-motion";

const MotionDiv = motion.div;

export function GoalRing({ value, max }) {
  const safeMax = Math.max(max, 1);
  const pct = Math.min((value / safeMax) * 100, 100);
  const angle = (pct / 100) * 360;

  return (
    <div className="relative h-32 w-32">
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from -90deg, rgba(34,211,238,0.95) ${angle}deg, rgba(39,39,42,0.4) ${angle}deg 360deg)`,
        }}
      />
      <div className="absolute inset-2 rounded-full bg-zinc-950/90 backdrop-blur-xl" />
      <MotionDiv
        key={`${value}-${max}`}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.28 }}
        className="absolute inset-0 grid place-items-center text-center"
      >
        <p className="text-xl font-semibold text-white">{Math.round(pct)}%</p>
        <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">goal</p>
      </MotionDiv>
    </div>
  );
}
