import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Crown, Database, Loader2, Clock } from "lucide-react";
import { LeaderboardTable } from "../components/leaderboard/LeaderboardTable";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { useProfileStore } from "../store/useProfileStore";
import { useTrackerStore } from "../store/useTrackerStore";
import { enrichLeaderboardPlayers, readStudyMinutes } from "../utils/leaderboard";

const CACHE_KEY = "neet-leaderboard-cache";

export function LeaderboardPage() {
  const [players, setPlayers] = useState(() => {
    // Initial state from cache
    try {
      const saved = localStorage.getItem(CACHE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  const [sort, setSort] = useState("activity");
  const [loading, setLoading] = useState(false);
  const [isCached, setIsCached] = useState(true);
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
  } = useLeaderboardSync({ enabled: true, pollInterval: 30000 }); // Slower poll for free tier

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    // Extended health check for cold starts
    const health = await checkHealth();
    if (!health.ok) {
      if (players.length === 0) {
        setError(health.error || lastError || "Connecting to cloud...");
      }
      setLoading(false);
      return;
    }

    try {
      await syncNow();
      const list = await fetchLeaderboard(sort);
      
      const enriched = enrichLeaderboardPlayers(list, playerId, {
        studyMinutes: localStudyMinutes,
        totalSolved: localTotalSolved,
        totalPagesRead: localTotalPagesRead,
      });

      const snap = JSON.stringify(enriched.map((p) => [p.totalSolved, p.totalPagesRead, p.studyMinutes]));
      if (prevSnapshot.current && prevSnapshot.current !== snap) {
        setLiveFlash(true);
        setTimeout(() => setLiveFlash(false), 900);
      }
      prevSnapshot.current = snap;
      
      setPlayers(enriched);
      setIsCached(false);
      
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(enriched));
      
      if (list.length === 0) {
        setError("Connected! No players yet — log MCQs to appear.");
      } else {
        setError("");
      }
    } catch (e) {
      if (players.length === 0) {
        setError(e.message || "Could not load leaderboard.");
      }
    } finally {
      setLoading(false);
    }
  }, [
    checkHealth,
    serverUrl,
    lastError,
    syncNow,
    fetchLeaderboard,
    sort,
    playerId,
    localStudyMinutes,
    localTotalSolved,
    localTotalPagesRead,
    players.length
  ]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  const first = players[0];

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Global Leaderboard</h1>
            {isCached && players.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-zinc-800/50 px-3 py-1 border border-white/5">
                <Clock className="h-3 w-3 text-zinc-500" />
                <span className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Cached View</span>
              </div>
            )}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                <span className="animate-pulse">Waking up cloud engine (Render Free Tier)...</span>
              </span>
            ) : connected ? (
              <>
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Live
                {usingProxy ? " · local proxy" : ` · ${serverUrl}`}
              </>
            ) : (
              "Cloud Engine Sleeping"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="rounded-lg border border-white/10 p-2 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {error && players.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-start gap-3 rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-200/80"
          >
            <Database className="h-4 w-4 mt-0.5 shrink-0" />
            <p className="whitespace-pre-wrap">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {loading && players.length > 0 && (
          <div className="absolute inset-x-0 -top-1 z-20 h-[2px] overflow-hidden bg-white/5 rounded-full">
            <motion.div 
              className="h-full bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </div>
        )}

        {first && (
          <motion.div
            className={`rank-one-hero genz-glass mb-6 overflow-hidden rounded-2xl border border-amber-400/40 p-5 ${loading ? 'opacity-60 grayscale-[0.3]' : ''}`}
            animate={{ boxShadow: ["0 0 30px rgba(251,191,36,0.15)", "0 0 50px rgba(251,191,36,0.25)", "0 0 30px rgba(251,191,36,0.15)"] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="rank-one-crown flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/40 to-yellow-600/20 text-3xl shadow-lg shadow-amber-500/10">
                <Crown className="h-8 w-8 text-amber-300" />
              </div>
              <div className="flex-1 min-w-[200px]">
                <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/80 font-black">Elite Sentinel #1</p>
                <p className="text-2xl font-black text-white italic">{first.displayName}</p>
                <p className="text-xs text-amber-100/70 font-bold uppercase tracking-widest">{first.rankLabel}</p>
              </div>
              <div className="flex flex-wrap gap-4 text-center text-sm ml-auto">
                <div className="px-3 border-r border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">MCQs</p>
                  <p className="font-black text-cyan-300 text-lg">{first.totalSolved?.toLocaleString()}</p>
                </div>
                <div className="px-3 border-r border-white/5">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Pages</p>
                  <p className="font-black text-violet-300 text-lg">{first.totalPagesRead?.toLocaleString()}</p>
                </div>
                <div className="px-3">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Activity</p>
                  <p className="font-black text-white text-lg">{first.activityTotal?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className={loading ? "opacity-50 pointer-events-none transition-opacity duration-500" : "transition-opacity duration-300"}>
          <LeaderboardTable players={players} selfPlayerId={playerId} liveFlash={liveFlash} />
        </div>
      </div>

      <footer className="mt-6 flex flex-col items-center gap-2">
        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
          {loading ? "Establishing handshake..." : "Sync protocol active · Updates every 30s"}
        </p>
        <p className="text-[9px] text-zinc-700 italic">
          Hover a row for profile details · Data persists in MongoDB Cloud
        </p>
      </footer>
    </div>
  );
}
