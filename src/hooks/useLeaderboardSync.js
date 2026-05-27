import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "./useAuthShim";
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
  const isRateLimitedRef = useRef(false);
  const [isRateLimited, setIsRateLimitedState] = useState(false);
  
  const setIsRateLimited = (val) => {
    isRateLimitedRef.current = val;
    setIsRateLimitedState(val);
  };

  const cooldownRef = useRef(0);

  const apiBase = getApiBase(serverUrl);
  const usingProxy = !apiBase;
  const isLegacyServer = serverUrl.includes("ngrok") || serverUrl.includes("localhost") || serverUrl.includes("127.0.0.1");

  const activePlayerId = clerkUserId || useProfileStore.getState().playerId;

  const checkHealth = useCallback(
    async (urlOverride) => {
      // Don't even try if we are in a cooldown period
      if (Date.now() < cooldownRef.current) return { ok: false, error: "Rate limit cooldown active", status: 429 };

      const raw = urlOverride ?? serverUrl;
      const result = await checkServerHealth(raw);
      if (!urlOverride) {
        setServerOnline(result.ok);
        if (!result.ok && result.status === 429) {
          setIsRateLimited(true);
          cooldownRef.current = Date.now() + 30000; // 30s cooldown
        } else if (result.ok) {
          setIsRateLimited(false);
          setLastError("");
        } else {
          setLastError(result.error || "Connection failed");
        }
      }
      return result;
    },
    [serverUrl],
  );

  const register = useCallback(async () => {
    if (!activePlayerId || Date.now() < cooldownRef.current) return false;
    try {
      const { displayName, decor } = useProfileStore.getState();
      const token = (clerkUserId && !isLegacyServer) ? await getToken() : null;
      
      const res = await apiFetch(serverUrl, "/api/players/register", {
        method: "POST",
        headers: { 
          "X-Player-Id": activePlayerId,
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ playerId: activePlayerId, displayName, decor: decor || DEFAULT_DECOR }),
      });

      if (res.status === 429) {
        setIsRateLimited(true);
        cooldownRef.current = Date.now() + 60000; // 1m cooldown
        return false;
      }

      return res.ok;
    } catch (e) {
      setLastError(e.message);
      return false;
    }
  }, [serverUrl, getToken, activePlayerId, clerkUserId, isLegacyServer]);

  const pushStats = useCallback(async () => {
    if (!activePlayerId || Date.now() < cooldownRef.current) return false;
    try {
      const { 
        displayName: name, 
        decor: d,
        unlockedItems,
        pendingCrates,
        savedCrates,
        totalCratesOpened
      } = useProfileStore.getState();
      const stats = getSnapshot(); 
      const token = (clerkUserId && !isLegacyServer) ? await getToken() : null;

      const res = await apiFetch(serverUrl, `/api/players/${activePlayerId}/stats`, {
        method: "PUT",
        headers: { 
          "X-Player-Id": activePlayerId,
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          totalSolved: stats.totalSolved || 0,
          totalPagesRead: stats.totalPagesRead || 0,
          studyMinutes: stats.studyMinutes || 0,
          xp: stats.xp || 0,
          level: stats.level || 1,
          streak: stats.streak || 0,
          bestStreak: stats.bestStreak || 0,
          rankLabel: stats.rankLabel || "Aspirant",
          dailyLogs: stats.dailyLogs || {},
          dailyPageLogs: stats.dailyPageLogs || {},
          displayName: name,
          decor: d,
          unlockedItems,
          pendingCrates,
          savedCrates,
          totalCratesOpened,
        }),
      });

      if (res.status === 429) {
        console.warn("[Sync] Rate limited (429) during stats push.");
        setIsRateLimited(true);
        cooldownRef.current = Date.now() + 60000;
        return false;
      }

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[Sync] Stats push failed (${res.status}):`, errText);
        setLastError(`Sync failed (${res.status})`);
        return false;
      }

      setLastSyncedAt(Date.now());
      setIsRateLimited(false);
      return true;
    } catch (e) {
      console.error("[Sync] Network error during push:", e);
      setLastError(e.message);
      return false;
    }
  }, [serverUrl, getSnapshot, setLastSyncedAt, getToken, activePlayerId, clerkUserId, isLegacyServer]);

  const syncNow = useCallback(async () => {
    if (!authLoaded) return { ok: false, reason: "auth-loading" };
    if (Date.now() < cooldownRef.current) return { ok: false, reason: "rate-limited" };
    
    if (!clerkUserId) ensurePlayerId();
    if (!activePlayerId) return { ok: false, reason: "no-player" };

    const health = await checkHealth();
    if (!health.ok) return { ok: false, reason: isRateLimitedRef.current ? "rate-limited" : "offline" };

    try {
      // 0. Identity Alignment: Ensure local playerId matches Clerk ID
      if (clerkUserId && useProfileStore.getState().playerId !== clerkUserId) {
        useProfileStore.setState({ playerId: clerkUserId });
      }

      // 1. Initial Handshake: Register and check existing cloud state
      await register();
      
      // In Legacy Mode, we skip the aggressive "Restore" pull and just push
      if (isLegacyServer) {
        const pushed = await pushStats();
        return { ok: pushed, reason: pushed ? null : "sync-failed" };
      }

      const res = await apiFetch(serverUrl, `/api/players/${activePlayerId}`);
      if (res.ok) {
        const cloudData = await res.json();
        const localStats = getSnapshot();
        const localProfile = useProfileStore.getState();

        // 2. Authoritative Sync: Align local state with MongoDB Cloud
        const cloudActivity = cloudData.activityTotal || 0;
        const localActivity = localStats.activityTotal || 0;
        
        const shouldRestore = cloudActivity > localActivity || (cloudData.totalSolved || 0) > (localStats.totalSolved || 0);

        if (shouldRestore) {
          console.log("[Sync] Restoration triggered. Aligning local state with MongoDB Cloud.");
          
          const currentStore = useTrackerStore.getState();
          const mergedDailyLogs = { ...currentStore.dailyLogs };
          Object.entries(cloudData.dailyLogs || {}).forEach(([date, count]) => {
            mergedDailyLogs[date] = Math.max(mergedDailyLogs[date] || 0, count);
          });

          const mergedDailyPageLogs = { ...currentStore.dailyPageLogs };
          Object.entries(cloudData.dailyPageLogs || {}).forEach(([date, count]) => {
            mergedDailyPageLogs[date] = Math.max(mergedDailyPageLogs[date] || 0, count);
          });

          useTrackerStore.setState({
            xp: Math.max(localStats.xp || 0, cloudData.xp || 0),
            totalSolved: Math.max(localStats.totalSolved || 0, cloudData.totalSolved || 0),
            totalPagesRead: Math.max(localStats.totalPagesRead || 0, cloudData.totalPagesRead || 0),
            studyMinutes: Math.max(localStats.studyMinutes || 0, cloudData.studyMinutes || 0),
            streak: Math.max(currentStore.streak || 0, cloudData.streak || 0),
            bestStreak: Math.max(currentStore.bestStreak || 0, cloudData.bestStreak || 0),
            dailyLogs: mergedDailyLogs,
            dailyPageLogs: mergedDailyPageLogs,
          });

          // Also update profile store with cloud identity
          useProfileStore.setState({
            displayName: cloudData.displayName || localProfile.displayName,
            decor: { ...localProfile.decor, ...(cloudData.decor || {}) },
            unlockedItems: cloudData.unlockedItems && cloudData.unlockedItems.length > localProfile.unlockedItems.length 
              ? cloudData.unlockedItems 
              : localProfile.unlockedItems,
            pendingCrates: cloudData.pendingCrates || localProfile.pendingCrates,
            savedCrates: cloudData.savedCrates || localProfile.savedCrates,
            totalCratesOpened: Math.max(localProfile.totalCratesOpened, cloudData.totalCratesOpened || 0),
          });
        }
      }
      
      // 3. Push local changes (includes merge results)
      const pushed = await pushStats();
      if (pushed) {
        console.log("[Sync] Handshake successful. Cloud profile matched.");
      } else {
        console.warn("[Sync] Handshake completed but stats push was unsuccessful.");
      }
      
      return { ok: pushed, reason: pushed ? null : "sync-failed" };
    } catch (e) {
      console.error("[Sync] Critical sync error:", e);
      setLastError(e.message);
      return { ok: false, reason: "error", error: e.message };
    }
  }, [authLoaded, clerkUserId, ensurePlayerId, activePlayerId, checkHealth, register, pushStats, getSnapshot, serverUrl, isLegacyServer]);

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

  // Use refs for callbacks in interval to avoid re-triggering the effect
  const checkHealthRef = useRef(checkHealth);
  const syncNowRef = useRef(syncNow);
  useEffect(() => {
    checkHealthRef.current = checkHealth;
    syncNowRef.current = syncNow;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    
    // Immediate check
    checkHealthRef.current();

    const id = setInterval(async () => {
      // Auto-retry connection handshakes on heartbeat recovery
      const isHealthy = await checkHealthRef.current();
      if (isHealthy.ok) {
        syncNowRef.current();
      }
    }, pollInterval);
    
    return () => clearInterval(id);
  }, [enabled, pollInterval]);

  useEffect(() => {
    if (!enabled) return undefined;
    const onStudyMinute = () => scheduleSync();
    window.addEventListener("neet:study-minute", onStudyMinute);
    return () => window.removeEventListener("neet:study-minute", onStudyMinute);
  }, [enabled, scheduleSync]);

  useEffect(() => {
    if (!enabled) return undefined;
    // Sync immediately on mount/enable, and whenever studyMinutes changes
    scheduleSync();
    return undefined;
  }, [enabled, studyMinutes, scheduleSync]);

  return {
    serverUrl: apiBase || (typeof window !== "undefined" ? `${window.location.origin} (proxy)` : ""),
    apiEndpoint: apiUrl(serverUrl, "/api"),
    usingProxy,
    connected: serverOnline,
    lastError,
    isRateLimited,
    scheduleSync,
    syncNow,
    fetchLeaderboard,
    testConnection,
    checkHealth,
    register,
    pushStats,
  };
}
