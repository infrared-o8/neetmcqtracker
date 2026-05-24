import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { getAllRanksProgress } from "../utils/gamification";

export function RankLadder({ activityTotal }) {
  const [open, setOpen] = useState(false);
  const ranks = getAllRanksProgress(activityTotal);

  return (
    <div className="genz-glass rounded-3xl p-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-xs uppercase tracking-[0.22em] text-zinc-400">All ranks</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-3 max-h-64 space-y-2 overflow-y-auto"
          >
            {ranks.map((r) => (
              <li
                key={r.label}
                className={`rounded-xl border px-3 py-2 ${
                  r.current
                    ? "border-cyan-400/40 bg-cyan-500/10"
                    : r.achieved
                      ? "border-white/5 bg-white/5 opacity-70"
                      : "border-white/5 bg-zinc-900/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${r.current ? "chroma-text" : "text-zinc-200"}`}>
                    {r.label}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-500">{r.minSolved.toLocaleString()}</span>
                </div>
                
                {!r.achieved && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800/50 border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${r.progressPercent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-600/60 to-violet-500/60 shadow-[0_0_8px_rgba(139,92,246,0.3)]"
                      />
                    </div>
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-zinc-600">
                      <span>{Math.round(r.progressPercent)}% to milestone</span>
                      <span>{r.remaining.toLocaleString()} left</span>
                    </div>
                  </div>
                )}
                
                {r.achieved && (
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/80">Unlocked</span>
                  </div>
                )}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
