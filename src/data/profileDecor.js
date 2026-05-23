export const DEFAULT_DECOR = {
  bannerId: "nebula",
  frameId: "rare",
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
  common: { border: "border-zinc-500/40", glow: "" },
  rare: { border: "border-cyan-400/50", glow: "shadow-[0_0_12px_rgba(34,211,238,0.3)]" },
  epic: { border: "border-fuchsia-400/60", glow: "shadow-[0_0_16px_rgba(232,121,249,0.4)]" },
  legendary: { border: "border-amber-400/70", glow: "shadow-[0_0_20px_rgba(251,191,36,0.45)]" },
  mythic: {
    border: "border-transparent",
    glow: "animate-chroma-border shadow-[0_0_24px_rgba(168,85,247,0.5)]",
  },
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
