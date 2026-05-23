import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, Crown } from "lucide-react";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { useProfileStore } from "../store/useProfileStore";
import { useTrackerStore } from "../store/useTrackerStore";
import { enrichLeaderboardPlayers, readStudyMinutes } from "../utils/leaderboard";

export function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [sort, setSort] = useState("activity");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [liveFlash, setLiveFlash] = useState(false);
  const prevSnapshot = useRef("");
  const playerId = useProfileStore((s) => s.playerId);
  const localStudyMinutes = useTrackerStore((s) => s.studyMinutes);
  const localTotalSolved = useTrackerStore((s) => s.totalSolved);
  const localTotalPagesRead = useTrackerStore((s) => s.totalPagesRead);

  const {
    fetchLeaderboard,
    syncNow,
    serverUrl,
    usingProxy,
    connected,
    checkHealth,
    lastError,
  } = useLeaderboardSync({ enabled: true, pollInterval: 8000 });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const health = await checkHealth();
    if (!health.ok) {
      setPlayers([]);
      setError(
        health.error ||
          lastError ||
          (usingProxy ? "Server offline. Run: npm run server" : `Cannot reach ${serverUrl}`),
      );
      setLoading(false);
      return;
    }

    try {
      await syncNow();
      const list = await fetchLeaderboard(sort);
      const snap = JSON.stringify(list.map((p) => [p.totalSolved, p.totalPagesRead, p.studyMinutes]));
      if (prevSnapshot.current && prevSnapshot.current !== snap) {
        setLiveFlash(true);
        setTimeout(() => setLiveFlash(false), 900);
      }
      prevSnapshot.current = snap;
      setPlayers(
        enrichLeaderboardPlayers(list, playerId, {
          studyMinutes: localStudyMinutes,
          totalSolved: localTotalSolved,
          totalPagesRead: localTotalPagesRead,
        }),
      );
      if (list.length === 0) {
        setError("Connected! No players yet — log MCQs and refresh.");
      } else {
        setError("");
      }
    } catch (e) {
      setPlayers([]);
      setError(e.message || "Could not load leaderboard.");
    } finally {
      setLoading(false);
    }
  }, [
    checkHealth,
    usingProxy,
    serverUrl,
    lastError,
    syncNow,
    fetchLeaderboard,
    sort,
    playerId,
    localStudyMinutes,
    localTotalSolved,
    localTotalPagesRead,
  ]);

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
  }, [load]);

  const first = players[0];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Leaderboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {connected ? (
              <>
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live
                {usingProxy ? " · local proxy" : ` · ${serverUrl}`}
              </>
            ) : (
              "Server offline"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["activity", "xp", "streak"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSort(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase ${
                sort === s ? "bg-violet-500/25 text-violet-200" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 whitespace-pre-wrap rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-100">
          {error}
        </p>
      )}

      {first && (
        <motion.div
          className="rank-one-hero genz-glass mb-6 overflow-hidden rounded-2xl border border-amber-400/40 p-5"
          animate={{ boxShadow: ["0 0 30px rgba(251,191,36,0.2)", "0 0 50px rgba(251,191,36,0.35)", "0 0 30px rgba(251,191,36,0.2)"] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <div className="rank-one-crown flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/40 to-yellow-600/20 text-3xl">
              <Crown className="h-8 w-8 text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80">Rank #1</p>
              <p className="text-2xl font-bold text-white">{first.displayName}</p>
              <p className="text-sm text-amber-100/70">{first.rankLabel}</p>
            </div>
            <div className="flex gap-4 text-center text-sm">
              <div>
                <p className="text-zinc-500">MCQs</p>
                <p className="font-bold text-cyan-300">{first.totalSolved?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-zinc-500">Pages</p>
                <p className="font-bold text-violet-300">{first.totalPagesRead?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-zinc-500">Activity</p>
                <p className="font-bold text-white">{first.activityTotal?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-zinc-500">Study</p>
                <p className="font-bold text-emerald-300">{readStudyMinutes(first)}m</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <LeaderboardTable players={players} selfPlayerId={playerId} liveFlash={liveFlash} />

      <p className="mt-4 text-center text-xs text-zinc-600">
        Hover a row for “view profile”, click to open · Study minutes sync on earn · Updates every 8s
      </p>
    </div>
  );
}
