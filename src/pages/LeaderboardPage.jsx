import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { LeaderboardRow } from "../components/leaderboard/LeaderboardRow";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { useProfileStore } from "../store/useProfileStore";

export function LeaderboardPage() {
  const [players, setPlayers] = useState([]);
  const [sort, setSort] = useState("activity");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const playerId = useProfileStore((s) => s.playerId);
  const {
    fetchLeaderboard,
    syncNow,
    serverUrl,
    usingProxy,
    connected,
    checkHealth,
  } = useLeaderboardSync({ enabled: true });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const online = await checkHealth();
    if (!online) {
      setPlayers([]);
      setError(
        usingProxy
          ? "Leaderboard server offline. In a terminal run: npm run server (keep it running), then refresh."
          : `Cannot reach server at ${serverUrl}. Check the URL in Settings and that npm run server is running on the host.`,
      );
      setLoading(false);
      return;
    }

    try {
      await syncNow();
      const list = await fetchLeaderboard(sort);
      setPlayers(list);
      if (list.length === 0) {
        setError("No players yet. Log some MCQs on the Dashboard, then refresh.");
      }
    } catch {
      setError("Could not load leaderboard. Is npm run server still running?");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [checkHealth, usingProxy, serverUrl, syncNow, fetchLeaderboard, sort]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const podium = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Leaderboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {connected ? (
              <>
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> Connected
                {usingProxy ? " via local proxy" : ` · ${serverUrl}`}
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
                sort === s
                  ? "bg-violet-500/25 text-violet-200"
                  : "text-zinc-500 hover:text-zinc-300"
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
        <p className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </p>
      )}

      {podium.length > 0 && (
        <div className="mb-8 grid grid-cols-3 items-end gap-3">
          {[1, 0, 2].map((idx) => {
            const p = podium[idx];
            if (!p) return <div key={idx} />;
            const heights = ["h-28", "h-36", "h-24"];
            return (
              <motion.div
                key={p.playerId}
                className={`genz-glass flex flex-col items-center justify-end rounded-2xl pb-3 ${heights[idx]}`}
                animate={{ y: [0, -4, 0] }}
                transition={{ repeat: Infinity, duration: 2 + idx * 0.3 }}
              >
                <span className="text-2xl">{p.decor?.avatarEmoji || "📚"}</span>
                <p className="mt-1 max-w-full truncate px-2 text-xs font-bold text-white">
                  {p.displayName}
                </p>
                <p className="text-[10px] text-violet-300">#{p.rank}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {rest.map((p) => (
          <LeaderboardRow key={p.playerId} player={p} isSelf={p.playerId === playerId} />
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-zinc-600">
        Hover a row for profile showcase
      </p>
    </div>
  );
}
