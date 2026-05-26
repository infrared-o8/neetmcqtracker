import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { DEFAULT_DECOR } from "../data/profileDecor";
import { apiFetch, apiUrl, checkServerHealth, getApiBase, normalizeServerUrl } from "../utils/api";

export function useLeaderboardSync({ pollInterval = 15000, enabled = true } = {}) {
  const { getToken, userId: clerkUserId, isLoaded: authLoaded } = useAuth();
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

  // Crucial: Prioritize Clerk ID to prevent identity mismatches on protected routes
  const activePlayerId = clerkUserId || useProfileStore.getState().playerId;

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
    if (!activePlayerId) return false;
    try {
      const { displayName, decor } = useProfileStore.getState();
      const token = clerkUserId ? await getToken() : null;
      
      const res = await apiFetch(serverUrl, "/api/players/register", {
        method: "POST",
        headers: { 
          "X-Player-Id": activePlayerId,
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ playerId: activePlayerId, displayName, decor: decor || DEFAULT_DECOR }),
      });
      return res.ok;
    } catch (e) {
      setLastError(e.message);
      return false;
    }
  }, [serverUrl, getToken, activePlayerId, clerkUserId]);

  const pushStats = useCallback(async () => {
    if (!activePlayerId) return false;
    try {
      const { displayName: name, decor: d } = useProfileStore.getState();
      const stats = getSnapshot();
      const token = clerkUserId ? await getToken() : null;

      const res = await apiFetch(serverUrl, `/api/players/${activePlayerId}/stats`, {
        method: "PUT",
        headers: { 
          "X-Player-Id": activePlayerId,
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
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
  }, [serverUrl, getSnapshot, setLastSyncedAt, getToken, activePlayerId, clerkUserId]);

  const syncNow = useCallback(async () => {
    if (!authLoaded) return { ok: false, reason: "auth-loading" };
    
    if (!clerkUserId) ensurePlayerId();
    if (!activePlayerId) return { ok: false, reason: "no-player" };

    const health = await checkHealth();
    if (!health.ok) return { ok: false, reason: "offline" };

    try {
      // 1. Initial Handshake: Register and check existing cloud state
      await register();
      
      const res = await apiFetch(serverUrl, `/api/players/${activePlayerId}`);
      if (res.ok) {
        const cloudData = await res.json();
        const localStats = getSnapshot();

        // 2. Conflict Resolution: Cloud-Wins-if-Greater
        // This ensures progress is restored on new devices/browsers
        const needsPull = 
          (cloudData.xp > localStats.xp) || 
          (cloudData.totalSolved > localStats.totalSolved) || 
          (cloudData.studyMinutes > localStats.studyMinutes);

        if (needsPull) {
          console.log("[Sync] Cloud state is ahead. Synchronizing local store...");
          
          const currentStore = useTrackerStore.getState();
          
          // Merge daily logs (ensure we keep highest progress per day)
          const mergedDailyLogs = { ...currentStore.dailyLogs };
          Object.entries(cloudData.dailyLogs || {}).forEach(([date, count]) => {
            mergedDailyLogs[date] = Math.max(mergedDailyLogs[date] || 0, count);
          });

          const mergedDailyPageLogs = { ...currentStore.dailyPageLogs };
          Object.entries(cloudData.dailyPageLogs || {}).forEach(([date, count]) => {
            mergedDailyPageLogs[date] = Math.max(mergedDailyPageLogs[date] || 0, count);
          });

          useTrackerStore.setState({
            xp: Math.max(localStats.xp, cloudData.xp || 0),
            totalSolved: Math.max(localStats.totalSolved, cloudData.totalSolved || 0),
            totalPagesRead: Math.max(localStats.totalPagesRead, cloudData.totalPagesRead || 0),
            studyMinutes: Math.max(localStats.studyMinutes, cloudData.studyMinutes || 0),
            streak: Math.max(currentStore.streak, cloudData.streak || 0),
            bestStreak: Math.max(currentStore.bestStreak, cloudData.bestStreak || 0),
            dailyLogs: mergedDailyLogs,
            dailyPageLogs: mergedDailyPageLogs,
          });
        }
      }
      
      // 3. Push local changes if they are ahead or equivalent
      const pushed = await pushStats();
      if (pushed) console.log("[Sync] Handshake successful. Progress secured.");
      
      return { ok: pushed, reason: pushed ? null : "sync-failed" };
    } catch (e) {
      setLastError(e.message);
      return { ok: false, reason: "error", error: e.message };
    }
  }, [authLoaded, clerkUserId, ensurePlayerId, activePlayerId, checkHealth, register, pushStats, getSnapshot, serverUrl]);

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
