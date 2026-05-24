import { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Trophy, Settings, Volume2, Vibrate, Cloud, BookOpen, Video, User } from "lucide-react";
import { useTrackerStore } from "../store/useTrackerStore";
import { PixelCompanion } from "./PixelCompanion";
import { useAmbientAudio } from "../hooks/useAmbientAudio";
import { parseYoutubeId } from "../utils/youtube";
import { StudyCameraPanel } from "./study/StudyCameraPanel";

const navClass = ({ isActive }) =>
  `flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? "bg-fuchsia-500/20 text-fuchsia-100 border border-fuchsia-400/30"
      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
  }`;

export function StudySidebar() {
  const trackingMode = useTrackerStore((s) => s.trackingMode);
  const setTrackingMode = useTrackerStore((s) => s.setTrackingMode);
  const preferences = useTrackerStore((s) => s.preferences);
  const setPreferences = useTrackerStore((s) => s.setPreferences);
  const dailyLogs = useTrackerStore((s) => s.dailyLogs);
  const dailyPageLogs = useTrackerStore((s) => s.dailyPageLogs);
  const dailyGoal = useTrackerStore((s) => s.dailyGoal);
  const dailyPageGoal = useTrackerStore((s) => s.dailyPageGoal);
  const today = new Date().toISOString().slice(0, 10);

  const [audioUrlDraft, setAudioUrlDraft] = useState(preferences.youtubeAudioUrl || "");

  useAmbientAudio();

  const todayMcq = dailyLogs[today] ?? 0;
  const todayPages = dailyPageLogs[today] ?? 0;
  const progress =
    trackingMode === "pages"
      ? dailyPageGoal > 0
        ? (todayPages / dailyPageGoal) * 100
        : 0
      : dailyGoal > 0
        ? (todayMcq / dailyGoal) * 100
        : 0;

  const audioId = parseYoutubeId(audioUrlDraft);
  const audioActive = preferences.ambientTrack === "youtube";

  const playYoutubeAudio = () => {
    if (!audioId) return;
    setPreferences({
      youtubeAudioUrl: audioUrlDraft.trim(),
      ambientTrack: "youtube",
    });
  };

  const stopRoomSound = () => {
    setPreferences({ ambientTrack: "off" });
  };

  return (
    <aside className="genz-glass flex w-[260px] shrink-0 flex-col border-r border-white/5 p-4 md:w-[280px]">
      <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">NEET Tracker</p>
      <nav className="mt-4 flex flex-col gap-1">
        <NavLink to="/" end className={navClass}>
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </NavLink>
        <NavLink to="/leaderboard" className={navClass}>
          <Trophy className="h-4 w-4" />
          Leaderboard
        </NavLink>
        <NavLink to="/profile" className={navClass}>
          <User className="h-4 w-4" />
          Profile Hub
        </NavLink>
        <NavLink to="/study-room" className={navClass}>
          <Video className="h-4 w-4" />
          Study Room
        </NavLink>
        <NavLink to="/settings" className={navClass}>
          <Settings className="h-4 w-4" />
          Settings
        </NavLink>
      </nav>

      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Track</p>
        <div className="mt-2 flex gap-1 rounded-xl bg-zinc-900/60 p-1">
          {["mcq", "pages"].map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTrackingMode(mode)}
              className={`flex-1 rounded-lg py-2 text-xs font-semibold uppercase transition ${
                trackingMode === mode
                  ? "bg-fuchsia-500/30 text-fuchsia-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {mode === "mcq" ? "MCQ" : "NCERT"}
            </button>
          ))}
        </div>
      </div>

      <PixelCompanion progressPercent={progress} />

      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Micro-rewards</p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setPreferences({ soundEnabled: !preferences.soundEnabled })}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 text-xs ${
              preferences.soundEnabled
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                : "border-white/5 text-zinc-500"
            }`}
          >
            <Volume2 className="h-3.5 w-3.5" />
            Sound
          </button>
          <button
            type="button"
            onClick={() => setPreferences({ hapticsEnabled: !preferences.hapticsEnabled })}
            className={`flex flex-1 items-center justify-center gap-1 rounded-xl border py-2 text-xs ${
              preferences.hapticsEnabled
                ? "border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-100"
                : "border-white/5 text-zinc-500"
            }`}
          >
            <Vibrate className="h-3.5 w-3.5" />
            Haptic
          </button>
        </div>
      </div>

      <div className="mt-6 flex-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Room sound (YouTube)</p>
        <input
          type="url"
          value={audioUrlDraft}
          onChange={(e) => setAudioUrlDraft(e.target.value)}
          placeholder="Paste YouTube link…"
          className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-xs text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-violet-400/40"
        />
        {audioUrlDraft && !audioId && (
          <p className="mt-1 text-[10px] text-amber-400">Invalid YouTube URL</p>
        )}
        {audioId && <p className="mt-1 text-[10px] text-emerald-400/80">Video ID: {audioId}</p>}
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={!audioId}
            onClick={playYoutubeAudio}
            className={`flex-1 rounded-xl border py-2 text-xs font-semibold transition ${
              audioActive
                ? "border-violet-400/50 bg-violet-500/25 text-violet-100"
                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 disabled:opacity-40"
            }`}
          >
            {audioActive ? "Playing" : "Play"}
          </button>
          <button
            type="button"
            onClick={stopRoomSound}
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-zinc-400 hover:bg-white/5"
          >
            Off
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-zinc-600">
          Uses only this link. Click Play after pasting (browser autoplay rules).
        </p>
      </div>

      <div className="mt-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Cozy Presets</p>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setPreferences({ cozyPreset: "default" })}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              preferences.cozyPreset === "default"
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                : "border-white/5 text-zinc-400 hover:bg-white/5"
            }`}
          >
            <span className="text-lg">✨</span>
            Default
          </button>
          <button
            type="button"
            onClick={() => setPreferences({ cozyPreset: "monsoon" })}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              preferences.cozyPreset === "monsoon"
                ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
                : "border-white/5 text-zinc-400 hover:bg-white/5"
            }`}
          >
            <Cloud className="h-4 w-4" />
            🌧️ Monsoon Night
          </button>
          <button
            type="button"
            onClick={() => setPreferences({ cozyPreset: "library" })}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition ${
              preferences.cozyPreset === "library"
                ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                : "border-white/5 text-zinc-400 hover:bg-white/5"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            ☕ Old Library
          </button>
        </div>
      </div>

      <StudyCameraPanel />
    </aside>
  );
}
