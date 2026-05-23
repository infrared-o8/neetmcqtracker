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
                  <span className={`text-sm font-medium ${r.current ? "chroma-text" : "text-zinc-200"}`}>
                    {r.label}
                  </span>
                  <span className="text-xs text-zinc-500">{r.minSolved.toLocaleString()}</span>
                </div>
                {!r.achieved && r.progressPercent > 0 && (
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                      style={{ width: `${r.progressPercent}%` }}
                    />
                  </div>
                )}
                {r.achieved && <span className="text-[10px] text-emerald-400">Unlocked</span>}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
