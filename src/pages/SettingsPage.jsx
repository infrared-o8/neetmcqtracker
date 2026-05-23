import { useState } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { apiFetch } from "../utils/api";
import { parseYoutubeId } from "../utils/youtube";
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
    const result = await testConnection(urlInput.trim());
    if (!result.ok) {
      setStatus(result.error || "Connection failed.");
      return;
    }
    const { playerId: pid } = useProfileStore.getState();
    const savedUrl = useTrackerStore.getState().preferences.serverUrl;
    try {
      await apiFetch(savedUrl, "/api/players/register", {
        method: "POST",
        headers: { "X-Player-Id": pid },
        body: JSON.stringify({ playerId: pid, displayName, decor }),
      });
      await syncNow();
      setStatus(`Connected to ${result.url || savedUrl || "server"} — synced!`);
    } catch (e) {
      setStatus(e.message);
    }
  };

  const saveDecor = async () => {
    ensurePlayerId();
    await pushStats();
    setStatus("Profile saved & synced");
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-bold text-white">Settings</h1>
      <p className="mt-1 text-sm text-zinc-500">Profile, leaderboard, and showcase decor</p>

      <section className="genz-glass mt-8 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Leaderboard server</h2>
        <p className="mt-2 text-sm text-zinc-500">
          <strong className="text-zinc-400">Local dev:</strong> leave empty and run{" "}
          <code className="text-cyan-400">npm run server</code> — Vite proxies{" "}
          <code className="text-cyan-400">/api</code> automatically.
          <br />
          <strong className="text-zinc-400">Friend&apos;s laptop:</strong> they run{" "}
          <code className="text-cyan-400">npm run server</code> — you enter{" "}
          <code className="text-cyan-400">http://THEIR_IP:3847</code> (http required). Same Wi‑Fi.
        </p>
        <input
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="http://192.168.1.42:3847"
          className="mt-3 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-white outline-none focus:ring-2 focus:ring-fuchsia-400/40"
        />
        <button
          type="button"
          onClick={test}
          className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-sm font-semibold text-cyan-100"
        >
          Test & sync
        </button>
        {status && (
          <p
            className={`mt-2 text-sm leading-relaxed whitespace-pre-wrap ${
              status.startsWith("Connected") ? "text-emerald-300" : "text-amber-200"
            }`}
          >
            {status}
          </p>
        )}
        <p className="mt-2 text-[10px] text-zinc-600">Player ID: {playerId || "—"}</p>
      </section>

      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Background video (YouTube)</h2>
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

      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Profile</h2>
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

      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Showcase decor</h2>
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

      <section className="genz-glass mt-6 rounded-3xl p-5">
        <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-400">Preview card</h2>
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
