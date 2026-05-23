import { useCallback, useEffect, useRef, useState } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { DEFAULT_DECOR } from "../data/profileDecor";
import { apiFetch, apiUrl, getApiBase } from "../utils/api";

export function useLeaderboardSync({ pollInterval = 15000, enabled = true } = {}) {
  const serverUrl = useTrackerStore((s) => s.preferences.serverUrl);
  const getSnapshot = useTrackerStore((s) => s.getSnapshot);
  const displayName = useProfileStore((s) => s.displayName);
  const decor = useProfileStore((s) => s.decor);
  const ensurePlayerId = useProfileStore((s) => s.ensurePlayerId);
  const setLastSyncedAt = useProfileStore((s) => s.setLastSyncedAt);
  const debounceRef = useRef(null);
  const [serverOnline, setServerOnline] = useState(false);

  const apiBase = getApiBase(serverUrl);
  const usingProxy = !apiBase;

  const checkHealth = useCallback(async (urlOverride) => {
    try {
      const res = await apiFetch(urlOverride ?? serverUrl, "/api/health", {
        signal: AbortSignal.timeout(5000),
      });
      const ok = res.ok;
      if (!urlOverride) setServerOnline(ok);
      return ok;
    } catch {
      if (!urlOverride) setServerOnline(false);
      return false;
    }
  }, [serverUrl]);

  const register = useCallback(async () => {
    const { playerId } = useProfileStore.getState();
    if (!playerId) return false;
    try {
      const res = await apiFetch(serverUrl, "/api/players/register", {
        method: "POST",
        headers: { "X-Player-Id": playerId },
        body: JSON.stringify({
          playerId,
          displayName: useProfileStore.getState().displayName,
          decor: useProfileStore.getState().decor || DEFAULT_DECOR,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, [serverUrl]);

  const pushStats = useCallback(async () => {
    const { playerId, displayName: name, decor: d } = useProfileStore.getState();
    if (!playerId) return false;
    try {
      const stats = getSnapshot();
      const res = await apiFetch(serverUrl, `/api/players/${playerId}/stats`, {
        method: "PUT",
        headers: { "X-Player-Id": playerId },
        body: JSON.stringify({ ...stats, displayName: name, decor: d }),
      });
      if (res.ok) setLastSyncedAt(Date.now());
      return res.ok;
    } catch {
      return false;
    }
  }, [serverUrl, getSnapshot, setLastSyncedAt]);

  const syncNow = useCallback(async () => {
    ensurePlayerId();
    const { playerId } = useProfileStore.getState();
    if (!playerId) return { ok: false, reason: "no-player" };

    const online = await checkHealth();
    if (!online) return { ok: false, reason: "offline" };

    await register();
    const pushed = await pushStats();
    return { ok: pushed, reason: pushed ? null : "sync-failed" };
  }, [ensurePlayerId, checkHealth, register, pushStats]);

  const scheduleSync = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      syncNow();
    }, 2000);
  }, [syncNow]);

  const fetchLeaderboard = useCallback(
    async (sort = "activity") => {
      try {
        const res = await apiFetch(serverUrl, `/api/leaderboard?sort=${sort}`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error("bad response");
        const data = await res.json();
        return data.players ?? [];
      } catch {
        throw new Error("fetch-failed");
      }
    },
    [serverUrl],
  );

  const testConnection = useCallback(
    async (urlOverride) => {
      return checkHealth(urlOverride ?? serverUrl);
    },
    [checkHealth, serverUrl],
  );

  useEffect(() => {
    ensurePlayerId();
  }, [ensurePlayerId]);

  useEffect(() => {
    if (!enabled) return undefined;
    checkHealth();
    const id = setInterval(() => {
      checkHealth();
      syncNow();
    }, pollInterval);
    return () => clearInterval(id);
  }, [enabled, pollInterval, checkHealth, syncNow]);

  return {
    serverUrl: apiBase || (typeof window !== "undefined" ? `${window.location.origin} (proxy)` : ""),
    apiEndpoint: apiUrl(serverUrl, "/api"),
    usingProxy,
    connected: serverOnline,
    serverOnline,
    scheduleSync,
    syncNow,
    fetchLeaderboard,
    testConnection,
    checkHealth,
    register,
    pushStats,
  };
}
