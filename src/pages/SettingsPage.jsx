import { useState } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { apiFetch } from "../utils/api";
import { parseYoutubeId } from "../utils/youtube";
import { Zap, ShieldAlert, MonitorOff, Layout, RefreshCw, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import {
  ACCENTS,
  AVATAR_EMOJIS,
  BANNERS,
  DEFAULT_DECOR,
  FRAMES,
  TITLES,
} from "../data/profileDecor";

export function SettingsPage() {
  const preferences = useTrackerStore((s) => s.preferences);
  const setPreferences = useTrackerStore((s) => s.setPreferences);
  const displayName = useProfileStore((s) => s.displayName);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const decor = useProfileStore((s) => s.decor);
  const setDecor = useProfileStore((s) => s.setDecor);
  const playerId = useProfileStore((s) => s.playerId);
  const ensurePlayerId = useProfileStore((s) => s.ensurePlayerId);
  const { testConnection, syncNow, pushStats } = useLeaderboardSync({ enabled: false });
  const [status, setStatus] = useState("");
  const [urlInput, setUrlInput] = useState(preferences.serverUrl || "");
  const [videoUrlDraft, setVideoUrlDraft] = useState(preferences.youtubeVideoUrl || "");
  const videoId = parseYoutubeId(videoUrlDraft);

  const test = async () => {
    ensurePlayerId();
    setStatus("Verifying server reachability...");
    const result = await testConnection(urlInput.trim());
    
    if (!result.ok) {
      setStatus(result.error || "Connection failed.");
      return;
    }

    const { playerId: pid } = useProfileStore.getState();
    const currentBase = urlInput.trim();
    
    try {
      setStatus("Checking LiveKit compatibility...");
      const tokenCheck = await apiFetch(currentBase, "/api/livekit/token", {
        method: "POST",
        body: JSON.stringify({ playerName: "compat-check" }),
      });

      if (tokenCheck.status === 404) {
        setStatus("⚠️ Server connected, but LiveKit endpoint is MISSING (404).\nYour backend is outdated. Please use 'Restart Backend' below.");
        return;
      }

      setStatus("Registering player...");
      await apiFetch(currentBase, "/api/players/register", {
        method: "POST",
        headers: { "X-Player-Id": pid },
        body: JSON.stringify({ playerId: pid, displayName, decor }),
      });
      
      await syncNow();
      setStatus(`✅ Fully Connected & Verified!\nSyncing with: ${result.url || "Local Server"}`);
    } catch (e) {
      setStatus(`Partial Success: Server found, but encountered an error:\n${e.message}`);
    }
  };

  const autoRepair = async () => {
    setStatus("Starting Auto-Repair sequence...");
    setPreferences({ serverUrl: "" });
    setUrlInput("");
    
    try {
      setStatus("Attempting to cycle local backend...");
      await apiFetch("", "/api/admin/restart", { method: "POST" });
      setStatus("Repair signal sent. Waiting 3s for reboot...");
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (e) {
      setStatus("Local repair failed. Please manually restart the terminal running 'npm run server'.");
    }
  };

  const saveDecor = async () => {
    ensurePlayerId();
    await pushStats();
    setStatus("Profile saved & synced");
  };

  const restartServer = async () => {
    if (!confirm("Are you sure you want to restart the backend server?")) return;
    try {
      setStatus("Sending restart signal...");
      await apiFetch(preferences.serverUrl, "/api/admin/restart", { method: "POST" });
      setStatus("Restart signal sent. Server should be back in a few seconds.");
    } catch (e) {
      setStatus(`Error: ${e.message}\nTry the 'Force Manual Reset' button below.`);
    }
  };

  const copyNukeCommand = () => {
    const cmd = 'npx --yes kill-port 3847; npx --yes kill-port 3847; npm run server';
    navigator.clipboard.writeText(cmd);
    setStatus("✅ Command Copied!\nPaste this into your terminal on the main laptop.");
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 pb-24">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">Profile, performance, and admin controls</p>

      {/* Connection & Smart Fix */}
      <section className="genz-glass mt-8 rounded-3xl p-5 border-fuchsia-500/20 bg-fuchsia-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-fuchsia-400" />
            <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Grid Sync & Repair</h2>
          </div>
          <button 
            onClick={autoRepair}
            className="rounded-lg bg-zinc-800 px-3 py-1 text-[10px] font-bold text-zinc-400 hover:bg-zinc-700 hover:text-white transition border border-white/5"
          >
            Run Auto-Repair
          </button>
        </div>
        
        <div className="mt-4 space-y-3">
          <p className="text-[11px] text-zinc-500">
            If you see '404' or 'Not Found', your backend might be stuck on an old process. 
            <strong> Auto-Repair</strong> will reset your connection and attempt a server reboot.
          </p>
          
          <div className="relative">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://192.168.1.42:3847 (Leave empty for local)"
              className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-fuchsia-400/40 transition"
            />
            <button
              onClick={test}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-fuchsia-500 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-fuchsia-600 transition shadow-lg shadow-fuchsia-500/20"
            >
              Test & Sync
            </button>
          </div>
          
          {status && (
            <div className={`rounded-xl border p-3 text-xs font-mono leading-relaxed break-all ${
              status.includes("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : 
              status.includes("⚠️") ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
              "bg-zinc-900/80 border-white/10 text-zinc-400"
            }`}>
              {status}
            </div>
          )}
        </div>
      </section>

      {/* Optimization Section */}
      <section className="genz-glass mt-6 rounded-3xl p-5 border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-cyan-400" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Optimization Engine</h2>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500 uppercase tracking-wider">Smooth handling for less intense GPUs</p>
        
        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer items-center justify-between group">
            <div className="flex items-center gap-3">
              <MonitorOff className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transition" />
              <div>
                <p className="text-sm text-zinc-200">UI Optimization Mode</p>
                <p className="text-[10px] text-zinc-500">Disables blur, glassmorphism, and glows</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.uiOptimized}
              onChange={(e) => setPreferences({ uiOptimized: e.target.checked })}
              className="h-5 w-5 rounded border-white/20 accent-cyan-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between group border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <EyeOff className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transition" />
              <div>
                <p className="text-sm text-zinc-200">Hide AI Camera Self-View</p>
                <p className="text-[10px] text-zinc-500">Reduces browser lag by hiding local video feed</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!preferences.showAiSelfView}
              onChange={(e) => setPreferences({ showAiSelfView: !e.target.checked })}
              className="h-5 w-5 rounded border-white/20 accent-cyan-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between group border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <Layout className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transition" />
              <div>
                <p className="text-sm text-zinc-200">Disable Hover Effects & Animations</p>
                <p className="text-[10px] text-zinc-500">Strips all transitions and scaling for max performance</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.disableAnimations}
              onChange={(e) => setPreferences({ disableAnimations: e.target.checked })}
              className="h-5 w-5 rounded border-white/20 accent-cyan-500"
            />
          </label>
        </div>
      </section>

      {/* Admin Section */}
      <section className="genz-glass mt-6 rounded-3xl p-5 border-rose-500/20 bg-rose-500/5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Admin Section</h2>
        </div>
        
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl bg-black/40 border border-white/5 p-4">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 text-center italic">Standard Protocol</p>
            <button
              onClick={restartServer}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 py-3 text-xs font-bold text-rose-200 hover:bg-rose-500/25 transition shadow-lg shadow-rose-500/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Restart Backend Server
            </button>
          </div>

          <div className="rounded-2xl bg-zinc-950/60 border border-red-500/20 p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 bg-red-500 text-white text-[8px] font-black uppercase px-2 rounded-bl-lg">Danger Zone</div>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Force Manual Reset</p>
            <p className="text-[10px] text-zinc-500 leading-tight mb-3">If you get 404s, a ghost process is blocking the port. Click below to copy the Nuke & Boot command.</p>
            <button
              onClick={copyNukeCommand}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2.5 text-[10px] font-black text-white hover:bg-zinc-700 transition uppercase tracking-tighter"
            >
              Copy Port Nuke Command
            </button>
          </div>
        </div>
      </section>

      {/* Background Video */}
      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Background video (YouTube)</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Lo-fi / study video behind the app (muted autoplay). Paste any YouTube watch or share link.
        </p>
        <input
          type="url"
          value={videoUrlDraft}
          onChange={(e) => setVideoUrlDraft(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-violet-400/40"
        />
        {videoUrlDraft && !videoId && (
          <p className="mt-1 text-xs text-amber-400">Invalid YouTube URL</p>
        )}
        <label className="mt-4 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={preferences.bgVideoEnabled}
            disabled={!videoId}
            onChange={(e) => {
              setPreferences({
                youtubeVideoUrl: videoUrlDraft.trim(),
                bgVideoEnabled: e.target.checked && Boolean(videoId),
              });
            }}
            className="h-4 w-4 rounded border-white/20 accent-violet-500"
          />
          <span className="text-sm text-zinc-300">Show background video</span>
        </label>
        <button
          type="button"
          disabled={!videoId}
          onClick={() =>
            setPreferences({
              youtubeVideoUrl: videoUrlDraft.trim(),
              bgVideoEnabled: true,
            })
          }
          className="mt-3 rounded-xl border border-violet-400/30 bg-violet-500/15 px-4 py-2 text-sm font-semibold text-violet-100 disabled:opacity-40"
        >
          Apply video
        </button>
      </section>

      {/* Profile */}
      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Profile</h2>
        <label className="mt-3 block text-xs text-zinc-500">Display name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
          className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-white"
        />
        <p className="mt-4 text-xs text-zinc-500">Avatar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATAR_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setDecor({ avatarEmoji: e })}
              className={`rounded-lg border px-2 py-1 text-xl ${
                decor.avatarEmoji === e ? "border-fuchsia-400 bg-fuchsia-500/20" : "border-white/5"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </section>

      {/* Showcase Decor */}
      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Showcase decor</h2>
        <div
          className="mt-4 h-24 rounded-2xl border border-white/10"
          style={{ background: BANNERS[decor.bannerId] || BANNERS.nebula }}
        />
        <p className="mt-4 text-xs text-zinc-500">Banner</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(BANNERS).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setDecor({ bannerId: id })}
              className={`h-8 w-12 rounded-lg border ${decor.bannerId === id ? "border-white" : "border-transparent"}`}
              style={{ background: BANNERS[id] }}
            />
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">Frame rarity</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.keys(FRAMES).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setDecor({ frameId: id })}
              className={`rounded-lg border px-3 py-1 text-xs capitalize ${
                decor.frameId === id ? "border-fuchsia-400 text-fuchsia-200" : "border-white/10 text-zinc-400"
              }`}
            >
              {id}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">Title</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TITLES.map((t) => (
            <button
              key={t || "none"}
              type="button"
              onClick={() => setDecor({ titleId: t })}
              className={`rounded-lg border px-3 py-1 text-xs ${
                decor.titleId === t ? "border-cyan-400 text-cyan-200" : "border-white/10 text-zinc-400"
              }`}
            >
              {t || "None"}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-zinc-500">Accent</p>
        <div className="mt-2 flex gap-2">
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setDecor({ accent: c })}
              className={`h-8 w-8 rounded-full border-2 ${decor.accent === c ? "border-white" : "border-transparent"}`}
              style={{ background: c }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={saveDecor}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 py-3 text-sm font-semibold text-white"
        >
          Save & sync profile
        </button>
      </section>

      {/* Preview */}
      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Preview card</h2>
        <div
          className={`mt-4 overflow-hidden rounded-2xl border-2 ${FRAMES[decor.frameId]?.border || ""} ${FRAMES[decor.frameId]?.glow || ""}`}
          style={{ background: BANNERS[decor.bannerId] }}
        >
          <div className="bg-black/50 p-4 backdrop-blur-sm">
            <span className="text-3xl">{decor.avatarEmoji || DEFAULT_DECOR.avatarEmoji}</span>
            <p className="mt-2 font-bold text-white">{displayName}</p>
            {decor.titleId && <p className="chroma-text text-xs">{decor.titleId}</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
