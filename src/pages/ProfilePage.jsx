import { useState, useCallback } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { 
  User, 
  Sparkles, 
  Award, 
  Package, 
  Layout, 
  Trophy, 
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";
import {
  ACCENTS,
  AVATAR_EMOJIS,
  BANNERS,
  DEFAULT_DECOR,
  FRAMES,
  TITLES,
} from "../data/profileDecor";
import { CaseUnlockView } from "../components/dashboard/CaseUnlockView";

export default function ProfilePage() {
  const displayName = useProfileStore((s) => s.displayName);
  const setDisplayName = useProfileStore((s) => s.setDisplayName);
  const decor = useProfileStore((s) => s.decor);
  const setDecor = useProfileStore((s) => s.setDecor);
  const unlockedItems = useProfileStore((s) => s.unlockedItems) || [];
  const pendingCrates = useProfileStore((s) => s.pendingCrates) || [];
  const removeFirstPendingCrate = useProfileStore((s) => s.removeFirstPendingCrate);
  const totalCratesOpened = useProfileStore((s) => s.totalCratesOpened) || 0;
  
  const { pushStats } = useLeaderboardSync({ enabled: false });
  const [status, setStatus] = useState("");
  const [openingCrate, setOpeningCrate] = useState(false);

  const saveProfile = async () => {
    await pushStats();
    setStatus("Profile updated & synced!");
    setTimeout(() => setStatus(""), 3000);
  };

  const unlockedTitles = unlockedItems.filter(i => i.type === 'title');
  const unlockedFrames = unlockedItems.filter(i => i.type === 'frame');

  // Group pending crates by type for stacking
  const groupedCrates = pendingCrates.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Group titles by label for stacking (xN)
  const groupedTitles = unlockedTitles.reduce((acc, item) => {
    if (!acc[item.label]) {
      acc[item.label] = { ...item, count: 0 };
    }
    acc[item.label].count += 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 pb-32">
      {openingCrate && (
        <CaseUnlockView 
          crateType={pendingCrates[0]} 
          onDismiss={() => {
            setOpeningCrate(false);
            removeFirstPendingCrate();
          }} 
        />
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Personal Hub</h1>
          <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold">Identity & Inventory</p>
        </div>
        {status && (
          <div className="rounded-full bg-emerald-500/20 px-4 py-1.5 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/20 animate-pulse">
            {status}
          </div>
        )}
      </header>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Preview & Basic Info */}
        <div className="space-y-6">
          <section className="genz-glass overflow-hidden rounded-[2.5rem] border-white/10 p-2 shadow-2xl">
             <div
                className={`overflow-hidden rounded-[2.3rem] border-2 transition-all duration-500 ${
                  decor.customFrameStyle || FRAMES[decor.frameId]?.border || "border-zinc-800"
                } ${FRAMES[decor.frameId]?.glow || ""}`}
                style={{ background: BANNERS[decor.bannerId] }}
              >
                <div className="bg-black/40 p-8 text-center backdrop-blur-md">
                  <div className="relative mx-auto h-24 w-24 mb-4">
                    <div className="absolute inset-0 blur-2xl opacity-20" style={{ backgroundColor: decor.accent }} />
                    <span className="relative z-10 text-6xl drop-shadow-2xl select-none">
                      {decor.avatarEmoji || DEFAULT_DECOR.avatarEmoji}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-white truncate px-2">{displayName}</h3>
                  {decor.titleId && (
                    <p className="chroma-text mt-1 text-xs font-black uppercase tracking-widest">{decor.titleId}</p>
                  )}
                  
                  <div className="mt-6 flex items-center justify-center gap-4 border-t border-white/5 pt-6">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Crates</p>
                      <p className="text-sm font-black text-white">{totalCratesOpened}</p>
                    </div>
                    <div className="h-6 w-px bg-white/5" />
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Collection</p>
                      <p className="text-sm font-black text-white">{unlockedItems.length}</p>
                    </div>
                  </div>
                </div>
             </div>
          </section>

          <section className="genz-glass rounded-3xl p-6 border-white/5">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <User className="h-3 w-3" /> Basic Identity
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
                  onBlur={saveProfile}
                  className="mt-1 w-full rounded-xl border border-white/5 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-fuchsia-500/50 outline-none transition"
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest ml-1 mb-2">Avatar Emoji</p>
                <div className="grid grid-cols-5 gap-2">
                  {AVATAR_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setDecor({ avatarEmoji: e }); saveProfile(); }}
                      className={`rounded-xl border py-2 text-xl transition-all active:scale-90 ${
                        decor.avatarEmoji === e ? "border-fuchsia-500 bg-fuchsia-500/20" : "border-white/5 bg-white/5 grayscale hover:grayscale-0"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Inventory & Showcase */}
        <div className="lg:col-span-2 space-y-8">
          {/* UNOPENED CRATES - EXCLUSIVE SECTION */}
          <section className="relative overflow-hidden rounded-[2rem] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-600/10 to-indigo-600/10 p-8 shadow-xl shadow-fuchsia-500/5">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Package className="h-32 w-32 -rotate-12" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic">
                <Package className="h-6 w-6 text-fuchsia-400" /> Unopened Crates
              </h2>
              
              {pendingCrates.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-4">
                  {Object.entries(groupedCrates).map(([type, count]) => (
                    <motion.button
                      key={type}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setOpeningCrate(true)}
                      className="group relative h-28 w-28 rounded-2xl border border-fuchsia-500/30 bg-black/40 p-4 transition-all hover:border-fuchsia-400 hover:shadow-lg hover:shadow-fuchsia-500/20"
                    >
                      <Package className="h-full w-full text-fuchsia-500 group-hover:animate-bounce" />
                      <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-600 text-[10px] font-black text-white shadow-xl border border-white/20">
                        x{count}
                      </div>
                      <p className="absolute bottom-2 left-0 w-full text-center text-[8px] font-black uppercase text-fuchsia-300">
                        {type === 'ASH_STASH' ? 'Aspirant' : 'Star Batch'}
                      </p>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border-2 border-dashed border-white/5 bg-white/5 py-10 text-center">
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No crates in inventory</p>
                  <p className="text-[10px] text-zinc-700 uppercase mt-1">Earn more AP to trigger drops</p>
                </div>
              )}
            </div>
          </section>

          {/* LOOT INVENTORY - UNLOCKED ITEMS */}
          <section className="genz-glass rounded-[2rem] border-white/5 p-8">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3 italic mb-8">
              <Award className="h-6 w-6 text-emerald-400" /> Loot Collection
            </h2>

            <div className="space-y-8">
               {/* Titles */}
               <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Layout className="h-3 w-3" /> Unlocked Titles
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { setDecor({ titleId: "" }); saveProfile(); }}
                    className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase transition-all ${
                      !decor.titleId ? "border-fuchsia-500 bg-fuchsia-500/20 text-white" : "border-white/5 bg-white/5 text-zinc-500"
                    }`}
                  >
                    None
                  </button>
                  {/* Default Starter Titles */}
                  {TITLES.filter(t => t).map(t => (
                    <button
                      key={t}
                      onClick={() => { setDecor({ titleId: t }); saveProfile(); }}
                      className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase transition-all ${
                        decor.titleId === t ? "border-fuchsia-500 bg-fuchsia-500/20 text-white" : "border-white/5 bg-white/5 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                  {/* Loot Titles (Stacked) */}
                  {Object.values(groupedTitles).map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setDecor({ titleId: item.label }); saveProfile(); }}
                      className={`rounded-xl border px-4 py-2 text-xs font-bold uppercase transition-all relative overflow-hidden group ${
                        decor.titleId === item.label ? "border-fuchsia-500 bg-fuchsia-500/20 text-white" : "border-white/10 bg-zinc-900/60 text-zinc-200 hover:border-white/30"
                      }`}
                      style={{ borderColor: decor.titleId === item.label ? undefined : `${item.rarityData.color}40` }}
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" style={{ color: item.rarityData.color }} />
                        {item.label} 
                        {item.count > 1 && (
                          <span className="ml-1 bg-black/40 px-1.5 py-0.5 rounded text-[8px] border border-white/10 text-white">x{item.count}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Frames */}
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Trophy className="h-3 w-3" /> Showcase Frames
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Only Common is unlocked for all by default */}
                  {Object.entries(FRAMES).filter(([id]) => id === 'common').map(([id, frame]) => (
                    <button
                      key={id}
                      onClick={() => { setDecor({ frameId: id, customFrameStyle: null }); saveProfile(); }}
                      className={`relative overflow-hidden rounded-[1.5rem] border-2 p-5 text-left transition-all ${frame.border} bg-zinc-900/40 ${
                        decor.frameId === id && !decor.customFrameStyle ? "ring-2 ring-white ring-offset-4 ring-offset-black scale-[1.02]" : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      <p className="text-xs font-black uppercase text-white">{id}</p>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase mt-1">Starter Rarity</p>
                    </button>
                  ))}
                  {/* Premium Unlocked Frames */}
                  {unlockedFrames.map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setDecor({ frameId: item.id, customFrameStyle: item.style }); saveProfile(); }}
                      className={`relative overflow-hidden rounded-[1.5rem] border-2 p-5 text-left transition-all ${item.style} ${
                        decor.frameId === item.id ? "ring-2 ring-white ring-offset-4 ring-offset-black scale-[1.02]" : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase text-white">{item.label}</p>
                        <Sparkles className="h-4 w-4" style={{ color: item.rarityData.color }} />
                      </div>
                      <p className="text-[8px] font-black uppercase mt-1" style={{ color: item.rarityData.color }}>{item.rarityData.label} UNLOCK</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Banners */}
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Background Banners</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(BANNERS).map(([id, bg]) => (
                    <button
                      key={id}
                      onClick={() => { setDecor({ bannerId: id }); saveProfile(); }}
                      className={`h-16 rounded-xl border-2 transition-all active:scale-95 ${
                        decor.bannerId === id ? "border-white scale-105 shadow-xl shadow-white/10" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                      style={{ background: bg }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
