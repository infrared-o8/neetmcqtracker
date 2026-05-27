import { useState, useMemo } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { useLogbookStore } from "../store/useLogbookStore";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { apiFetch } from "../utils/api";
import { parseYoutubeId } from "../utils/youtube";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, 
  ShieldAlert, 
  MonitorOff, 
  Layout, 
  RefreshCw, 
  EyeOff, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Volume2,
  Mic,
  Search,
  Settings,
  HardDrive,
  Terminal,
  Activity,
  Globe,
  Bell,
  Cpu,
  Monitor
} from "lucide-react";

export function SettingsPage() {
  const preferences = useTrackerStore((s) => s.preferences);
  const setPreferences = useTrackerStore((s) => s.setPreferences);
  const { testConnection, syncNow } = useLeaderboardSync({ enabled: false });
  const logbookStore = useLogbookStore();
  
  const [status, setStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [urlInput, setUrlInput] = useState(preferences.serverUrl || "");
  const [videoUrlDraft, setVideoUrlDraft] = useState(preferences.youtubeVideoUrl || "");
  const [devPassword, setDevPassword] = useState("");
  const [showDevToggle, setShowDevToggle] = useState(preferences.devModeEnabled);
  const [expandedSections, setExpandedSections] = useState({
    graphics: true,
    audio: true,
    network: true,
    advanced: false,
    aesthetic: true,
    vault: false
  });

  const videoId = parseYoutubeId(videoUrlDraft);

  const toggleSection = (id) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

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

  // --- SETTINGS SCHEMA ---
  const SETTINGS_METADATA = [
    {
      id: "uiOptimized",
      category: "graphics",
      label: "UI Optimization Mode",
      desc: "Disables animations, particles and heavy effects",
      icon: MonitorOff,
      type: "toggle"
    },
    {
      id: "enableGlassmorphism",
      category: "graphics",
      label: "Glassmorphic Blur Effects",
      desc: "Toggle translucent frosted glass aesthetic",
      icon: Layout,
      type: "toggle"
    },
    {
      id: "disableAnimations",
      category: "graphics",
      label: "Disable Hover Effects",
      desc: "Strips all transitions for max performance",
      icon: Activity,
      type: "toggle"
    },
    {
      id: "reduceGpuUsage",
      category: "graphics",
      label: "Reduce GPU Usage",
      desc: "Disables complex shaders and heavy gradients",
      icon: Cpu,
      type: "toggle"
    },
    {
      id: "enableParticleEngine",
      category: "graphics",
      label: "Enable Particle Engine",
      desc: "Enable/Disable the background aura effects",
      icon: Sparkles,
      type: "toggle"
    },
    {
      id: "highIntensityFx",
      category: "graphics",
      label: "High Intensity FX (Sol's RNG)",
      desc: "Boosts particle counts and glowing effects",
      icon: Zap,
      type: "toggle"
    },
    {
      id: "aiDetectionRate",
      category: "graphics",
      label: "AI Detection Rate",
      desc: "Interval for focus scanning",
      icon: RefreshCw,
      type: "select",
      options: [
        { label: "Normal (1s)", value: "normal" },
        { label: "Power Save (3s)", value: "power-save" },
        { label: "Ultra Low (5s)", value: "ultra-low" }
      ]
    },
    {
      id: "muteOnJoin",
      category: "audio",
      label: "Mute on Joining Hall",
      desc: "Enter study rooms with mic disabled",
      icon: ShieldAlert,
      type: "toggle"
    },
    {
      id: "micNoiseSuppression",
      category: "audio",
      label: "Remove Background Noise",
      desc: "Standard WebRTC noise suppression",
      icon: Volume2,
      type: "toggle"
    },
    {
      id: "micVoiceIsolation",
      category: "audio",
      label: "Isolate Human Voice",
      desc: "Enhanced echo cancellation and auto gain",
      icon: Mic,
      type: "toggle"
    },
    {
      id: "showAiSelfView",
      category: "audio",
      label: "Show AI Camera Feed",
      desc: "Visual feedback of your focus AI",
      icon: Monitor,
      type: "toggle",
      invert: false
    }
  ];

  const filteredSettings = useMemo(() => {
    if (!searchQuery) return SETTINGS_METADATA;
    const q = searchQuery.toLowerCase();
    return SETTINGS_METADATA.filter(s => 
      s.label.toLowerCase().includes(q) || 
      s.desc.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const renderSetting = (s) => {
    if (s.type === "toggle") {
      const isChecked = s.invert ? !preferences[s.id] : preferences[s.id];
      return (
        <label key={s.id} className="flex cursor-pointer items-center justify-between group py-3 px-1 transition-colors hover:bg-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <s.icon className={`h-4 w-4 ${isChecked ? 'text-cyan-400' : 'text-zinc-500'} group-hover:scale-110 transition`} />
            <div>
              <p className="text-sm text-zinc-200">{s.label}</p>
              <p className="text-[10px] text-zinc-500">{s.desc}</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              const val = s.invert ? !e.target.checked : e.target.checked;
              setPreferences({ [s.id]: val });
            }}
            className="h-5 w-5 rounded border-white/20 accent-cyan-500"
          />
        </label>
      );
    }
    if (s.type === "select") {
      return (
        <div key={s.id} className="flex flex-col gap-2 py-3 px-1">
          <div className="flex items-center gap-3">
            <s.icon className="h-4 w-4 text-zinc-500" />
            <div>
              <p className="text-sm text-zinc-200">{s.label}</p>
              <p className="text-[10px] text-zinc-500">{s.desc}</p>
            </div>
          </div>
          <select
            value={preferences[s.id]}
            onChange={(e) => setPreferences({ [s.id]: e.target.value })}
            className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-400/40"
          >
            {s.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      );
    }
    return null;
  };

  const renderSection = (id, title, icon, colorClass) => {
    const sectionItems = filteredSettings.filter(s => s.category === id);
    if (searchQuery && sectionItems.length === 0) return null;
    
    const isExpanded = expandedSections[id] || !!searchQuery;

    return (
      <section className={`genz-glass mt-6 rounded-[2rem] border-white/5 overflow-hidden transition-all ${isExpanded ? 'bg-black/20' : 'bg-black/10'}`}>
        <button 
          onClick={() => toggleSection(id)}
          className="flex w-full items-center justify-between p-6 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border transition-colors ${
              colorClass === 'cyan' ? 'bg-cyan-500/10 border-cyan-500/20' :
              colorClass === 'fuchsia' ? 'bg-fuchsia-500/10 border-fuchsia-500/20' :
              colorClass === 'violet' ? 'bg-violet-500/10 border-violet-500/20' :
              colorClass === 'indigo' ? 'bg-indigo-500/10 border-indigo-500/20' :
              colorClass === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/20' :
              'bg-rose-500/10 border-rose-500/20'
            }`}>
              {icon}
            </div>
            <h2 className="text-xs uppercase tracking-[0.25em] text-white font-black">{title}</h2>
          </div>
          {isExpanded ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 space-y-2"
            >
              {sectionItems.map(renderSetting)}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 pb-32">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">System</h1>
          <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Preferences & Engine</p>
        </div>
        <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5">
          <Settings className="h-6 w-6 text-zinc-400" />
        </div>
      </header>

      {/* Global Search */}
      <div className="relative mt-8 group">
        <div className="absolute inset-0 bg-cyan-500/5 blur-2xl group-focus-within:bg-cyan-500/10 transition-all" />
        <div className="relative flex items-center bg-black/40 border border-white/5 rounded-2xl px-4 py-3 group-focus-within:border-cyan-500/30 transition-all">
          <Search className="h-4 w-4 text-zinc-500 mr-3" />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search performance, audio, aura..."
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-zinc-700"
          />
        </div>
      </div>

      {/* Groups */}
      {renderSection("graphics", "Graphics & Performance", <Zap className="h-4 w-4 text-cyan-400" />, "cyan")}
      {renderSection("audio", "Live Study Stream (Audio/Video)", <Mic className="h-4 w-4 text-fuchsia-400" />, "fuchsia")}
      
      {/* Network & Handshake */}
      {(!searchQuery || "network sync server url test repair".includes(searchQuery.toLowerCase())) && (
        <section className={`genz-glass mt-6 rounded-[2rem] border-white/5 overflow-hidden transition-all ${(expandedSections.network || searchQuery) ? 'bg-black/20' : 'bg-black/10'}`}>
          <button 
            onClick={() => toggleSection('network')}
            className="flex w-full items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
                <RefreshCw className="h-4 w-4 text-violet-400" />
              </div>
              <h2 className="text-xs uppercase tracking-[0.25em] text-white font-black">Network & Handshake</h2>
            </div>
            {(expandedSections.network || searchQuery) ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
          </button>
          
          <AnimatePresence>
            {(expandedSections.network || searchQuery) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 space-y-4"
              >
                <div className="flex flex-col gap-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Authoritative Server Endpoint</p>
                  <div className="relative">
                    <input
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://your-server.com"
                      className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-400/40 transition"
                    />
                    <button
                      onClick={test}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-violet-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-violet-500 transition shadow-lg shadow-violet-500/20"
                    >
                      Test & Sync
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={autoRepair} className="flex-1 rounded-xl bg-white/5 border border-white/10 py-2.5 text-[10px] font-black uppercase text-zinc-400 hover:text-white transition">Auto-Repair</button>
                </div>

                {status && (
                  <div className={`rounded-xl border p-3 text-[10px] font-mono leading-relaxed break-all ${
                    status.includes("✅") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : 
                    status.includes("⚠️") ? "bg-amber-500/10 border-amber-500/20 text-amber-300" :
                    "bg-black/60 border-white/10 text-zinc-500"
                  }`}>
                    {status}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Aesthetic Section */}
      {(!searchQuery || "background video youtube aesthetic".includes(searchQuery.toLowerCase())) && (
        <section className={`genz-glass mt-6 rounded-[2rem] border-white/5 overflow-hidden transition-all ${(expandedSections.aesthetic || searchQuery) ? 'bg-black/20' : 'bg-black/10'}`}>
          <button 
            onClick={() => toggleSection('aesthetic')}
            className="flex w-full items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <Globe className="h-4 w-4 text-indigo-400" />
              </div>
              <h2 className="text-xs uppercase tracking-[0.25em] text-white font-black">Aesthetic Engine</h2>
            </div>
            {(expandedSections.aesthetic || searchQuery) ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
          </button>
            
          <AnimatePresence>
            {(expandedSections.aesthetic || searchQuery) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 space-y-3"
              >
                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 ml-1">YouTube Atmosphere URL</p>
                <input
                  type="url"
                  value={videoUrlDraft}
                  onChange={(e) => setVideoUrlDraft(e.target.value)}
                  placeholder="https://youtube.com/watch?v=…"
                  className="w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-3 text-sm text-white outline-none"
                />
                <button
                  onClick={() => setPreferences({ youtubeVideoUrl: videoUrlDraft.trim(), bgVideoEnabled: true })}
                  disabled={!videoId}
                  className="w-full rounded-xl bg-indigo-600 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 disabled:opacity-40 transition-all"
                >
                  Apply Atmosphere
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Obsidian Vault Section */}
      {(!searchQuery || "obsidian vault headers bio chem physics".includes(searchQuery.toLowerCase())) && (
        <section className={`genz-glass mt-6 rounded-[2rem] border-white/5 overflow-hidden transition-all ${(expandedSections.vault || searchQuery) ? 'bg-black/20' : 'bg-black/10'}`}>
          <button 
            onClick={() => toggleSection('vault')}
            className="flex w-full items-center justify-between p-6 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <HardDrive className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-xs uppercase tracking-[0.25em] text-white font-black">Obsidian Vault Headers</h2>
            </div>
            {(expandedSections.vault || searchQuery) ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
          </button>
          
          <AnimatePresence>
            {(expandedSections.vault || searchQuery) && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 space-y-4"
              >
                <p className="text-[10px] text-zinc-500 uppercase font-bold leading-relaxed mb-2 px-1">
                  Customize target headers for the #tag system. QuestCap will append entries ABOVE these exact strings in your .md file.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'mainHeader', label: 'Main Header (#finalprep)', color: 'rose' },
                    { id: 'bioHeader', label: 'Biology (#biopoint)', color: 'emerald' },
                    { id: 'chemHeader', label: 'Chemistry (#chempoint)', color: 'cyan' },
                    { id: 'phyHeader', label: 'Physics (#phypoint)', color: 'blue' },
                  ].map((h) => (
                    <div key={h.id} className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">{h.label}</label>
                      <input 
                        value={logbookStore[h.id]} 
                        onChange={(e) => logbookStore.setHeaders({ [h.id]: e.target.value })}
                        className={`w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-white outline-none transition-all focus:ring-1 focus:ring-zinc-700`}
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Advanced / Admin Section */}
      {renderSection("advanced", "Advanced Systems", <Terminal className="h-4 w-4 text-rose-400" />, "rose")}

      {/* Hidden Dev Mode Content */}
      <AnimatePresence>
        {(expandedSections.advanced || searchQuery) && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-5 mt-4 space-y-4">
            <button onClick={restartServer} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-500/15 py-3 text-xs font-bold text-rose-200 hover:bg-rose-500/25 transition">
              <RefreshCw className="h-3.5 w-3.5" /> Restart Backend Node
            </button>
            <button onClick={copyNukeCommand} className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-2.5 text-[10px] font-black text-white hover:bg-zinc-700 transition uppercase">
              Copy Port Nuke Command
            </button>

            <div className="border-t border-white/5 pt-4">
              {!showDevToggle ? (
                <input
                  type="password"
                  value={devPassword}
                  onChange={(e) => {
                    setDevPassword(e.target.value);
                    if (e.target.value.toLowerCase() === 'admin') { setShowDevToggle(true); setStatus("🔓 Dev Mode Unlocked"); }
                  }}
                  placeholder="Enter access code for engine tools..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] text-zinc-400 outline-none"
                />
              ) : (
                <label className="flex cursor-pointer items-center justify-between p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                    <div>
                      <p className="text-sm font-bold text-amber-200 uppercase tracking-tighter">Hyper-Luck Engine (+1000%)</p>
                      <p className="text-[10px] text-zinc-500 font-mono">Forces 50% drop probability</p>
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
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 text-center">
        <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Grid Engine v2.4.0 • Authorized Personnel Only</p>
      </footer>
    </div>
  );
}
