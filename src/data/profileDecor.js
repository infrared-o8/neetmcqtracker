export const DEFAULT_DECOR = {
  bannerId: "nebula",
  frameId: "c1",
  titleId: "",
  accent: "#a855f7",
  avatarEmoji: "📚",
};

export const BANNERS = {
  nebula: "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #0e7490 100%)",
  synthwave: "linear-gradient(135deg, #831843 0%, #581c87 50%, #1e3a8a 100%)",
  biohazard: "linear-gradient(135deg, #14532d 0%, #166534 50%, #052e16 100%)",
  monsoon: "linear-gradient(135deg, #0c4a6e 0%, #164e63 50%, #1e3a8a 100%)",
  "gold-rift": "linear-gradient(135deg, #78350f 0%, #a16207 50%, #713f12 100%)",
};

export const FRAMES = {
  // Compatibility Fallbacks
  "common": { name: "Dust", rarity: "common", border: "border-zinc-700 bg-zinc-800/40", glow: "" },
  "rare": { name: "Emerald Beacon", rarity: "rare", border: "border-cyan-500/40 bg-gradient-to-b from-cyan-950/40 to-zinc-900", glow: "" },
  "epic": { name: "Amethyst Flare", rarity: "epic", border: "animate-pulse border-purple-500/50 bg-gradient-to-r from-purple-900/40 via-fuchsia-950/30 to-indigo-900/40", glow: "" },
  "legendary": { name: "Celestial Ray", rarity: "legendary", border: "animate-pulse border-amber-500/70 bg-zinc-950", glow: "shadow-[0_0_25px_rgba(245,158,11,0.3)]" },
  "mythic": { name: "Chroma Syndicate", rarity: "mythic", border: "font-black uppercase tracking-wider animate-gradient border-orange-500 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500", glow: "shadow-[0_0_40px_rgba(249,115,22,0.5)]" },

  // COMMON
  "c1": { name: "Zinc Matte", rarity: "common", border: "border-zinc-700 bg-zinc-800/40", glow: "" },
  "c2": { name: "Slate Border", rarity: "common", border: "border-slate-700 bg-slate-900/50", glow: "" },
  "c3": { name: "Freshman Deck", rarity: "common", border: "border-stone-800 bg-stone-900/30", glow: "" },
  "c4": { name: "Graphite Texture", rarity: "common", border: "border-neutral-800 bg-neutral-900", glow: "" },
  "c5": { name: "Desk Oak", rarity: "common", border: "border-amber-900/30 bg-amber-950/20", glow: "" },
  "c6": { name: "Coaching Xerox", rarity: "common", border: "border-zinc-800 bg-zinc-950", glow: "" },
  "c7": { name: "Notebook Margin", rarity: "common", border: "border-l-2 border-l-zinc-500 border-y-zinc-800 border-r-zinc-800 bg-zinc-900", glow: "" },
  "c8": { name: "Dim Candle", rarity: "common", border: "border-orange-900/20 bg-orange-950/10", glow: "" },
  "c9": { name: "HB Pencil Shading", rarity: "common", border: "border-stone-700 bg-stone-800/20", glow: "" },
  "c10": { name: "Eraser Dust", rarity: "common", border: "border-zinc-800 bg-zinc-900/60 text-zinc-500", glow: "" },

  // RARE
  "r1": { name: "Emerald Spark", rarity: "rare", border: "border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 to-teal-950/30", glow: "" },
  "r2": { name: "Teal Velocity", rarity: "rare", border: "border-cyan-500/40 bg-gradient-to-b from-cyan-950/40 to-zinc-900", glow: "" },
  "r3": { name: "Bio Leaflet", rarity: "rare", border: "border-green-600/30 bg-zinc-900/80", glow: "" },
  "r4": { name: "Copper Trace", rarity: "rare", border: "border-orange-700/40 bg-zinc-950", glow: "" },
  "r5": { name: "Cobalt Reactor", rarity: "rare", border: "border-blue-500/40 bg-gradient-to-tr from-blue-950/40 to-slate-900", glow: "" },
  "r6": { name: "Acid Base", rarity: "rare", border: "border-lime-500/30 bg-zinc-900", glow: "" },
  "r7": { name: "Vector Path", rarity: "rare", border: "border-sky-500/30 bg-zinc-950", glow: "" },
  "r8": { name: "Highlighter Neon", rarity: "rare", border: "border-yellow-500/40 bg-zinc-900 text-yellow-400", glow: "" },
  "r9": { name: "Flask Rim", rarity: "rare", border: "border-indigo-500/40 bg-gradient-to-br from-indigo-950/30 to-zinc-900", glow: "" },
  "r10": { name: "Cell Membrane", rarity: "rare", border: "border-emerald-400/30 bg-zinc-900/90", glow: "" },

  // EPIC
  "e1": { name: "Amethyst Focus", rarity: "epic", border: "animate-pulse border-purple-500/50 bg-gradient-to-r from-purple-900/40 via-fuchsia-950/30 to-indigo-900/40", glow: "" },
  "e2": { name: "Crimson Caliber", rarity: "epic", border: "border-red-500/50 bg-gradient-to-r from-red-950/40 to-zinc-900", glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]" },
  "e3": { name: "Midnight Oil", rarity: "epic", border: "border-violet-500/40 bg-gradient-to-t from-violet-950/50 via-zinc-950 to-black", glow: "" },
  "e4": { name: "Voltage Spike", rarity: "epic", border: "border-amber-400/60 bg-zinc-950 text-amber-300", glow: "shadow-[inset_0_0_10px_rgba(245,158,11,0.1)]" },
  "e5": { name: "Obsidian Deep", rarity: "epic", border: "border-zinc-600 bg-black", glow: "shadow-[0_4px_20px_rgba(0,0,0,0.8)]" },
  "e6": { name: "Kinematic Flow", rarity: "epic", border: "border-indigo-500/50 bg-gradient-to-br from-blue-600/20 via-zinc-900 to-red-600/20", glow: "" },
  "e7": { name: "Prism Split", rarity: "epic", border: "border-y-pink-500/50 border-x-cyan-500/50 bg-zinc-900", glow: "" },
  "e8": { name: "Catalyst core", rarity: "epic", border: "border-emerald-500/60 bg-zinc-950", glow: "shadow-[0_0_12px_rgba(16,185,129,0.2)]" },
  "e9": { name: "Major Test Peak", rarity: "epic", border: "border-rose-500/50 bg-gradient-to-l from-rose-950/40 to-slate-900", glow: "" },
  "e10": { name: "Error Purge", rarity: "epic", border: "border-orange-500/60 bg-zinc-900", glow: "shadow-[0_0_10px_rgba(249,115,22,0.15)]" },

  // LEGENDARY
  "l1": { name: "Aura Shifter", rarity: "legendary", border: "animate-pulse border-amber-500/70 bg-zinc-950", glow: "shadow-[0_0_25px_rgba(245,158,11,0.3)]" },
  "l2": { name: "Quantum Matrix", rarity: "legendary", border: "border-cyan-400 bg-black", glow: "shadow-[0_0_30px_rgba(34,211,238,0.35),inset_0_0_15px_rgba(34,211,238,0.1)]" },
  "l3": { name: "Plasma Grid", rarity: "legendary", border: "border-dashed border-fuchsia-500 bg-zinc-900", glow: "shadow-[0_0_20px_rgba(217,70,239,0.4)]" },
  "l4": { name: "Star Batch Sigil", rarity: "legendary", border: "border-yellow-400 bg-gradient-to-tr from-yellow-600/30 via-zinc-950 to-amber-600/30", glow: "shadow-[0_0_25px_rgba(234,179,8,0.3)]" },
  "l5": { name: "Superconductor", rarity: "legendary", border: "border-blue-400 bg-neutral-950", glow: "shadow-[0_0_35px_rgba(96,165,250,0.4)]" },
  "l6": { name: "Absolute Zero", rarity: "legendary", border: "border-sky-300 bg-gradient-to-b from-sky-400/10 to-indigo-950/50", glow: "shadow-[0_0_20px_rgba(125,211,252,0.3)]" },
  "l7": { name: "Thermodynamic Aura", rarity: "legendary", border: "border-rose-500 bg-black", glow: "shadow-[0_0_25px_rgba(244,63,94,0.4)]" },
  "l8": { name: "Helix Overlord", rarity: "legendary", border: "border-emerald-400 bg-zinc-950", glow: "shadow-[0_0_30px_rgba(52,211,153,0.35)]" },
  "l9": { name: "Chronos Lock", rarity: "legendary", border: "border-stone-400 bg-stone-950", glow: "shadow-[0_0_15px_rgba(255,255,255,0.2)]" },
  "l10": { name: "Top 1K Beacon", rarity: "legendary", border: "border-orange-400 bg-gradient-to-r from-amber-500/20 via-orange-600/20 to-yellow-500/20", glow: "shadow-[0_0_30px_rgba(251,146,60,0.4)]" },

  // MYTHIC
  "m1": { name: "AIR Apex Wave", rarity: "mythic", border: "font-black uppercase tracking-wider animate-gradient border-orange-500 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500", glow: "shadow-[0_0_40px_rgba(249,115,22,0.5)]" },
  "m2": { name: "Singularity Void", rarity: "mythic", border: "scale-[1.02] border-white bg-black", glow: "shadow-[0_0_50px_rgba(255,255,255,0.6),inset_0_0_30px_rgba(255,255,255,0.2)]" },
  "m3": { name: "Nebula Overclock", rarity: "mythic", border: "border-purple-400 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500", glow: "shadow-[0_0_45px_rgba(168,85,247,0.6)]" },
  "m4": { name: "Kota Singularity", rarity: "mythic", border: "bg-clip-padding border-transparent bg-black before:absolute before:-z-10 before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-teal-400 before:to-blue-600 before:p-[2px]", glow: "shadow-[0_0_40px_#00ffcc]" },
  "m5": { name: "Supernova Catalyst", rarity: "mythic", border: "animate-bounce border-yellow-300 bg-neutral-950", glow: "shadow-[0_0_60px_rgba(253,224,71,0.5)]" },
  "m6": { name: "Hyperdimensional", rarity: "mythic", border: "animate-pulse border-fuchsia-400 bg-black", glow: "shadow-[0_0_50px_rgba(232,121,249,0.5),inset_0_0_20px_rgba(232,121,249,0.3)]" },
  "m7": { name: "AIIMS Sovereign", rarity: "mythic", border: "border-double border-4 border-yellow-400 bg-gradient-to-tr from-slate-950 via-yellow-950/30 to-slate-950", glow: "shadow-[0_0_40px_rgba(234,179,8,0.5)]" },
  "m8": { name: "Entropy Reversal", rarity: "mythic", border: "invert border-cyan-400 bg-zinc-950", glow: "shadow-[0_0_40px_rgba(34,211,238,0.5)]" },
  "m9": { name: "Infinite Loop", rarity: "mythic", border: "tracking-widest uppercase border-red-500 bg-black", glow: "shadow-[0_0_40px_rgba(239,68,68,0.6)]" },
  "m10": { name: "God Tier Aspirant", rarity: "mythic", border: "border-white bg-gradient-to-r from-violet-600 via-pink-500 to-blue-600", glow: "shadow-[0_0_50px_rgba(255,255,255,0.4)]" }
};

export const TITLES = [
  "",
  "Grinder",
  "Page Turner",
  "Streak Demon",
  "AIR Hunter",
  "Synaptic Elite",
];

export const ACCENTS = ["#a855f7", "#22d3ee", "#f43f5e", "#fbbf24", "#34d399", "#818cf8"];

export const AVATAR_EMOJIS = ["📚", "🧠", "⚡", "🔥", "🎯", "🧬", "💜", "🌙", "🏆", "✨"];
