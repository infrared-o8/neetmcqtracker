import { useState } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { apiFetch } from "../utils/api";
import { parseYoutubeId } from "../utils/youtube";
import { 
  Zap, 
  ShieldAlert, 
  MonitorOff, 
  Layout, 
  RefreshCw, 
  EyeOff, 
  ChevronDown, 
  ChevronUp,
  Sparkles
} from "lucide-react";

export function SettingsPage() {
  const preferences = useTrackerStore((s) => s.preferences);
  const setPreferences = useTrackerStore((s) => s.setPreferences);
  const { testConnection, syncNow } = useLeaderboardSync({ enabled: false });
  const [status, setStatus] = useState("");
  const [urlInput, setUrlInput] = useState(preferences.serverUrl || "");
  const [videoUrlDraft, setVideoUrlDraft] = useState(preferences.youtubeVideoUrl || "");
  const [devPassword, setDevPassword] = useState("");
  const [showDevToggle, setShowDevToggle] = useState(preferences.devModeEnabled);
  const videoId = parseYoutubeId(videoUrlDraft);

  const test = async () => {
    const result = await testConnection(urlInput.trim());
    if (!result.ok) {
      setStatus(result.error || "Connection failed.");
      return;
    }
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
      await apiFetch("", "/api/admin/restart", { method: "POST" });
      setStatus("Repair signal sent. Waiting 3s for reboot...");
      setTimeout(() => { window.location.reload(); }, 3000);
    } catch (e) {
      setStatus("Local repair failed. Please manually restart the terminal running 'npm run server'.");
    }
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
      <p className="mt-1 text-sm text-zinc-500">System performance and network configuration</p>

      {/* Grid Sync & Repair */}
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
          <div className="flex flex-col gap-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Sync Server URL</p>
            <div className="relative">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://your-ngrok-link.ngrok-free.app"
                className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-fuchsia-400/40 transition"
              />
              <button
                onClick={test}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-fuchsia-500 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-fuchsia-600 transition shadow-lg shadow-fuchsia-500/20"
              >
                Test & Sync
              </button>
            </div>
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
                <p className="text-[10px] text-zinc-500">Strips all transitions for max performance</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.disableAnimations}
              onChange={(e) => setPreferences({ disableAnimations: e.target.checked })}
              className="h-5 w-5 rounded border-white/20 accent-cyan-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between group border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transition" />
              <div>
                <p className="text-sm text-zinc-200">High Intensity FX (Sol's RNG)</p>
                <p className="text-[10px] text-zinc-500">Boosts particle counts and glowing effects for a massive aura</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.highIntensityFx}
              onChange={(e) => setPreferences({ highIntensityFx: e.target.checked })}
              className="h-5 w-5 rounded border-white/20 accent-cyan-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between group border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <Zap className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transition" />
              <div>
                <p className="text-sm text-zinc-200">Reduce GPU Usage</p>
                <p className="text-[10px] text-zinc-500">Disables complex shaders, tilt effects, and heavy gradients</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.reduceGpuUsage}
              onChange={(e) => setPreferences({ reduceGpuUsage: e.target.checked })}
              className="h-5 w-5 rounded border-white/20 accent-cyan-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between group border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-zinc-500 group-hover:text-cyan-400 transition" />
              <div>
                <p className="text-sm text-zinc-200">Enable Particle Engine</p>
                <p className="text-[10px] text-zinc-500">Enable/Disable the background aura effects</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.enableParticleEngine}
              onChange={(e) => setPreferences({ enableParticleEngine: e.target.checked })}
              className="h-5 w-5 rounded border-white/20 accent-cyan-500"
            />
          </label>

          <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-4 w-4 text-zinc-500" />
              <div>
                <p className="text-sm text-zinc-200">AI Detection Rate</p>
                <p className="text-[10px] text-zinc-500">Higher intervals reduce CPU/GPU stutter during scanning</p>
              </div>
            </div>
            <select
              value={preferences.aiDetectionRate}
              onChange={(e) => setPreferences({ aiDetectionRate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/40"
            >
              <option value="normal">Normal (1s interval)</option>
              <option value="power-save">Power Save (3s interval)</option>
              <option value="ultra-low">Ultra Low (5s interval)</option>
            </select>
          </div>

          <div className="border-t border-white/5 pt-4 mt-4">
            {!showDevToggle ? (
              <input
                type="password"
                value={devPassword}
                onChange={(e) => {
                  setDevPassword(e.target.value);
                  if (e.target.value.toLowerCase() === 'admin') { setShowDevToggle(true); setStatus("🔓 Dev Mode Unlocked"); }
                }}
                placeholder="Enter admin password for dev tools..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-zinc-400 outline-none"
              />
            ) : (
              <label className="flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-amber-200 uppercase tracking-tighter">Super Luck Dev Mode (+1000%)</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Forces drops to 50% probability</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.devModeEnabled}
                  onChange={(e) => setPreferences({ devModeEnabled: e.target.checked })}
                  className="h-5 w-5 rounded border-amber-500/20 accent-amber-500"
                />
              </label>
            )}
          </div>
        </div>
      </section>

      {/* Admin Section */}
      <section className="genz-glass mt-6 rounded-3xl p-5 border-rose-500/20 bg-rose-500/5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Admin Section</h2>
        </div>
        <div className="mt-4 space-y-4">
          <button onClick={restartServer} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 py-3 text-xs font-bold text-rose-200 hover:bg-rose-500/25 transition">
            <RefreshCw className="h-3.5 w-3.5" /> Restart Backend Server
          </button>
          <button onClick={copyNukeCommand} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2.5 text-[10px] font-black text-white hover:bg-zinc-700 transition uppercase">
            Copy Port Nuke Command
          </button>
        </div>
      </section>

      {/* Background Video */}
      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Background video (YouTube)</h2>
        <input
          type="url"
          value={videoUrlDraft}
          onChange={(e) => setVideoUrlDraft(e.target.value)}
          placeholder="https://youtube.com/watch?v=…"
          className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-white outline-none"
        />
        <button
          onClick={() => setPreferences({ youtubeVideoUrl: videoUrlDraft.trim(), bgVideoEnabled: true })}
          disabled={!videoId}
          className="mt-3 w-full rounded-xl border border-violet-400/30 bg-violet-500/15 py-2 text-sm font-semibold text-violet-100 disabled:opacity-40"
        >
          Apply background video
        </button>
      </section>
    </div>
  );
}
