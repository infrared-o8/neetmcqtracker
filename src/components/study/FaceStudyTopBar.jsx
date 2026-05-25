import { AnimatePresence, motion } from "framer-motion";
import { useFaceStudyContext } from "../../hooks/useFaceStudyContext";

const MotionDiv = motion.div;

export function FaceStudyTopBar() {
  const { active, faceDetected, confidence, progressPercent, minuteBurst } = useFaceStudyContext();

  if (!active) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-950/90 px-5 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
        <span>Face study timer</span>
        <span className={faceDetected ? "text-emerald-300" : "text-zinc-500"}>
          {faceDetected ? `Face ${Math.round(confidence * 100)}%` : "Looking for face…"}
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
        <MotionDiv
          className={`h-full rounded-full ${
            faceDetected
              ? "bg-gradient-to-r from-cyan-500 via-emerald-400 to-lime-300"
              : "bg-zinc-600"
          }`}
          animate={{ width: `${progressPercent}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 22 }}
        />
      </div>
      <p className="mt-1 text-center text-[10px] text-zinc-500">
        {faceDetected ? "Hold steady — 1 study minute per 60s" : "Timer pauses when face is lost"}
      </p>

      <AnimatePresence>
        {minuteBurst && (
          <MotionDiv
            key={minuteBurst.id}
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 1.05 }}
            className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center"
          >
            <span className="study-minute-burst rounded-2xl border border-emerald-400/40 bg-emerald-500/25 px-5 py-2 text-sm font-bold text-emerald-100 shadow-lg shadow-emerald-500/20">
              {minuteBurst.label}
              <span className="ml-2 text-xs font-semibold text-cyan-200">+1 XP</span>
            </span>
          </MotionDiv>
        )}
      </AnimatePresence>
    </div>
  );
}
