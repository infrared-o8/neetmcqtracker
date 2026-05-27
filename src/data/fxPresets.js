/**
 * Elite Handcrafted FX Blueprint
 * 25 Presets for the Aura System
 */
export const FX_TIERS = {
  MYTHIC: { label: "Mythic", color: "#f97316" },
  LEGENDARY: { label: "Legendary", color: "#f59e0b" },
  EPIC: { label: "Epic", color: "#a855f7" },
  RARE: { label: "Rare", color: "#3b82f6" },
  COMMON: { label: "Common", color: "#94a3b8" }
};

export const FX_PRESETS = {
  // --- Tier 1: Dark Matter & Void (Mythic) ---
  SINGULARITY_VOID: {
    id: "SINGULARITY_VOID",
    name: "Singularity Void",
    tier: "MYTHIC",
    rarityData: FX_TIERS.MYTHIC,
    colors: ["#000000", "#FFFFFF", "#8B5CF6"],
    particleCount: 80,
    style: "vortex"
  },
  ANTI_MATTER_FILAMENTS: {
    id: "ANTI_MATTER_FILAMENTS",
    name: "Anti-Matter Filaments",
    tier: "MYTHIC",
    rarityData: FX_TIERS.MYTHIC,
    colors: ["#000000", "#EF4444"],
    particleCount: 50,
    style: "tendrils"
  },
  COSMIC_DUST_CHRONO: {
    id: "COSMIC_DUST_CHRONO",
    name: "Cosmic Dust Chrono",
    tier: "MYTHIC",
    rarityData: FX_TIERS.MYTHIC,
    colors: ["#4F46E5", "#D946EF", "#FBBF24"],
    particleCount: 120,
    style: "nebula"
  },
  NEUTRON_ACCELERATOR: {
    id: "NEUTRON_ACCELERATOR",
    name: "Neutron Accelerator",
    tier: "MYTHIC",
    rarityData: FX_TIERS.MYTHIC,
    colors: ["#06B6D4", "#22D3EE"],
    particleCount: 2,
    style: "accelerator"
  },
  VOID_APEX_OVERDRIVE: {
    id: "VOID_APEX_OVERDRIVE",
    name: "Void Apex Overdrive",
    tier: "MYTHIC",
    rarityData: FX_TIERS.MYTHIC,
    colors: ["#C0C0C0", "#8B5CF6", "#00FFCC"],
    particleCount: 40,
    style: "glitch"
  },

  // --- Tier 2: Radiating Fire, Plasma (Legendary) ---
  KOTA_INFERNO: {
    id: "KOTA_INFERNO",
    name: "Kota Inferno",
    tier: "LEGENDARY",
    rarityData: FX_TIERS.LEGENDARY,
    colors: ["#F97316", "#DC2626", "#FACC15"],
    particleCount: 60,
    style: "fire"
  },
  PLASMA_GRID_SHOCK: {
    id: "PLASMA_GRID_SHOCK",
    name: "Plasma Grid Shock",
    tier: "LEGENDARY",
    rarityData: FX_TIERS.LEGENDARY,
    colors: ["#A855F7", "#FFFFFF"],
    particleCount: 30,
    style: "grid"
  },
  SUPERCONDUCTOR_OVERCLOCK: {
    id: "SUPERCONDUCTOR_OVERCLOCK",
    name: "Superconductor Overclock",
    tier: "LEGENDARY",
    rarityData: FX_TIERS.LEGENDARY,
    colors: ["#38BDF8", "#F59E0B"],
    particleCount: 40,
    style: "rings"
  },
  THERMODYNAMIC_RUPTURE: {
    id: "THERMODYNAMIC_RUPTURE",
    name: "Thermodynamic Rupture",
    tier: "LEGENDARY",
    rarityData: FX_TIERS.LEGENDARY,
    colors: ["#E11D48"],
    particleCount: 20,
    style: "heatwave"
  },
  AIR_APEX_IGNITION: {
    id: "AIR_APEX_IGNITION",
    name: "AIR Apex Ignition",
    tier: "LEGENDARY",
    rarityData: FX_TIERS.LEGENDARY,
    colors: ["#FBBF24", "#F59E0B"],
    particleCount: 50,
    style: "vectors"
  },

  // --- Tier 3: Biological Overdrive (Epic) ---
  MITOSIS_SYNAPSE: {
    id: "MITOSIS_SYNAPSE",
    name: "Mitosis Synapse",
    tier: "EPIC",
    rarityData: FX_TIERS.EPIC,
    colors: ["#10B981", "#064E3B"],
    particleCount: 40,
    style: "split"
  },
  DOUBLE_HELIX_VORTEX: {
    id: "DOUBLE_HELIX_VORTEX",
    name: "Double Helix Vortex",
    tier: "EPIC",
    rarityData: FX_TIERS.EPIC,
    colors: ["#06B6D4", "#EC4899"],
    particleCount: 60,
    style: "helix"
  },
  PATHOGEN_ECLIPSE: {
    id: "PATHOGEN_ECLIPSE",
    name: "Pathogen Eclipse",
    tier: "EPIC",
    rarityData: FX_TIERS.EPIC,
    colors: ["#84CC16", "#0F172A"],
    particleCount: 30,
    style: "virus"
  },
  SYNAPTIC_FIRE: {
    id: "SYNAPTIC_FIRE",
    name: "Synaptic Fire",
    tier: "EPIC",
    rarityData: FX_TIERS.EPIC,
    colors: ["#F43F5E", "#C084FC"],
    particleCount: 40,
    style: "neural"
  },
  EVOLUTIONARY_FLUID: {
    id: "EVOLUTIONARY_FLUID",
    name: "Evolutionary Fluid",
    tier: "EPIC",
    rarityData: FX_TIERS.EPIC,
    colors: ["#2DD4BF", "#A7F3D0", "#FFFFFF"],
    particleCount: 20,
    style: "fluid"
  },

  // --- Tier 4: Quantum Physics (Rare) ---
  WAVE_FUNCTION_COLLAPSE: {
    id: "WAVE_FUNCTION_COLLAPSE",
    name: "Wave Function Collapse",
    tier: "RARE",
    rarityData: FX_TIERS.RARE,
    colors: ["#22C55E"],
    particleCount: 30,
    style: "probability"
  },
  STRANDED_QUARK_SYSTEM: {
    id: "STRANDED_QUARK_SYSTEM",
    name: "Stranded Quark System",
    tier: "RARE",
    rarityData: FX_TIERS.RARE,
    colors: ["#EF4444", "#3B82F6", "#10B981"],
    particleCount: 3,
    style: "quarks"
  },
  ISOTOPE_DECAY_RADIA: {
    id: "ISOTOPE_DECAY_RADIA",
    name: "Isotope Decay Radia",
    tier: "RARE",
    rarityData: FX_TIERS.RARE,
    colors: ["#FDE047", "#84CC16"],
    particleCount: 40,
    style: "decay"
  },
  QUANTUM_MATRIX_MESH: {
    id: "QUANTUM_MATRIX_MESH",
    name: "Quantum Matrix Mesh",
    tier: "RARE",
    rarityData: FX_TIERS.RARE,
    colors: ["#4338CA", "#22D3EE"],
    particleCount: 25,
    style: "mesh"
  },
  ENTROPY_REVERSAL: {
    id: "ENTROPY_REVERSAL",
    name: "Entropy Reversal",
    tier: "RARE",
    rarityData: FX_TIERS.RARE,
    colors: ["#FFFFFF", "#000000"],
    particleCount: 50,
    style: "reverse"
  },

  // --- Tier 5: Scholarly Grind (Common) ---
  KOTA_MONSOON_RAIN: {
    id: "KOTA_MONSOON_RAIN",
    name: "Kota Monsoon Rain",
    tier: "COMMON",
    rarityData: FX_TIERS.COMMON,
    colors: ["#64748B", "#FFFFFF"],
    particleCount: 30,
    style: "rain"
  },
  MIDNIGHT_OIL_EMBERS: {
    id: "MIDNIGHT_OIL_EMBERS",
    name: "Midnight Oil Embers",
    tier: "COMMON",
    rarityData: FX_TIERS.COMMON,
    colors: ["#D97706", "#78350F"],
    particleCount: 25,
    style: "embers"
  },
  HB_SCHOLAR_MARGIN: {
    id: "HB_SCHOLAR_MARGIN",
    name: "HB Scholar Margin",
    tier: "COMMON",
    rarityData: FX_TIERS.COMMON,
    colors: ["#374151", "#DC2626"],
    particleCount: 1,
    style: "sketch"
  },
  COFFEE_STEAM_WHORL: {
    id: "COFFEE_STEAM_WHORL",
    name: "Coffee Steam Whorl",
    tier: "COMMON",
    rarityData: FX_TIERS.COMMON,
    colors: ["rgba(255,255,255,0.12)"],
    particleCount: 15,
    style: "steam"
  },
  ERROR_BOOK_PURGE: {
    id: "ERROR_BOOK_PURGE",
    name: "Error Book Purge",
    tier: "COMMON",
    rarityData: FX_TIERS.COMMON,
    colors: ["#F472B6", "#FFFFFF"],
    particleCount: 35,
    style: "erase"
  }
};
