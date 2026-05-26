import { useCallback, useEffect, useRef, useState } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { DEFAULT_DECOR } from "../data/profileDecor";
import { apiFetch, apiUrl, checkServerHealth, getApiBase, normalizeServerUrl } from "../utils/api";

export function useLeaderboardSync({ pollInterval = 15000, enabled = true } = {}) {
  const serverUrl = useTrackerStore((s) => s.preferences.serverUrl);
  const setPreferences = useTrackerStore((s) => s.setPreferences);
  const getSnapshot = useTrackerStore((s) => s.getSnapshot);
  const studyMinutes = useTrackerStore((s) => s.studyMinutes);
  const ensurePlayerId = useProfileStore((s) => s.ensurePlayerId);
  const setLastSyncedAt = useProfileStore((s) => s.setLastSyncedAt);
  const debounceRef = useRef(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [lastError, setLastError] = useState("");

  const apiBase = getApiBase(serverUrl);
  const usingProxy = !apiBase;

  const checkHealth = useCallback(
    async (urlOverride) => {
      const raw = urlOverride ?? serverUrl;
      const result = await checkServerHealth(raw);
      if (!urlOverride) {
        setServerOnline(result.ok);
        setLastError(result.ok ? "" : result.error || "Connection failed");
      }
      return result;
    },
    [serverUrl],
  );

  const register = useCallback(async () => {
    const { playerId, displayName, decor } = useProfileStore.getState();
    if (!playerId) return false;
    try {
      const res = await apiFetch(serverUrl, "/api/players/register", {
        method: "POST",
        headers: { "X-Player-Id": playerId },
        body: JSON.stringify({ playerId, displayName, decor: decor || DEFAULT_DECOR }),
      });
      return res.ok;
    } catch (e) {
      setLastError(e.message);
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
        body: JSON.stringify({
          ...stats,
          displayName: name,
          decor: d,
          studyMinutes: getSnapshot().studyMinutes ?? 0,
        }),
      });
      if (res.ok) setLastSyncedAt(Date.now());
      return res.ok;
    } catch (e) {
      setLastError(e.message);
      return false;
    }
  }, [serverUrl, getSnapshot, setLastSyncedAt]);

  const syncNow = useCallback(async () => {
    ensurePlayerId();
    const { playerId } = useProfileStore.getState();
    if (!playerId) return { ok: false, reason: "no-player" };

    const health = await checkHealth();
    if (!health.ok) {
      console.warn("[Sync] Network offline. Changes queued locally.");
      return { ok: false, reason: "offline", error: health.error };
    }

    await register();
    const pushed = await pushStats();
    if (pushed) {
      console.log("[Sync] Handshake successful. Queue flushed.");
    }
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
      const res = await apiFetch(serverUrl, `/api/leaderboard?sort=${sort}`);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      return data.players ?? [];
    },
    [serverUrl],
  );

  const testConnection = useCallback(
    async (urlOverride) => {
      const raw = urlOverride ?? serverUrl;
      const normalized = normalizeServerUrl(raw);
      if (raw?.trim() && !normalized) {
        return { ok: false, error: "Invalid URL." };
      }
      if (normalized && normalized !== getApiBase(serverUrl)) {
        setPreferences({ serverUrl: normalized });
      }
      return checkHealth(raw?.trim() ? normalized || raw : raw);
    },
    [serverUrl, checkHealth, setPreferences],
  );

  useEffect(() => {
    ensurePlayerId();
  }, [ensurePlayerId]);

  useEffect(() => {
    if (!enabled) return undefined;
    checkHealth();
    const id = setInterval(async () => {
      // Auto-retry connection handshakes on heartbeat recovery
      const isHealthy = await checkHealth();
      if (isHealthy.ok) {
        syncNow();
      }
    }, pollInterval);
    return () => clearInterval(id);
  }, [enabled, pollInterval, checkHealth, syncNow]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onStudyMinute = () => scheduleSync();
    window.addEventListener("neet:study-minute", onStudyMinute);
    return () => window.removeEventListener("neet:study-minute", onStudyMinute);
  }, [enabled, scheduleSync]);

  useEffect(() => {
    if (!enabled || studyMinutes <= 0) return undefined;
    scheduleSync();
    return undefined;
  }, [enabled, studyMinutes, scheduleSync]);

  return {
    serverUrl: apiBase || (typeof window !== "undefined" ? `${window.location.origin} (proxy)` : ""),
    apiEndpoint: apiUrl(serverUrl, "/api"),
    usingProxy,
    connected: serverOnline,
    lastError,
    scheduleSync,
    syncNow,
    fetchLeaderboard,
    testConnection,
    checkHealth,
    register,
    pushStats,
  };
}
