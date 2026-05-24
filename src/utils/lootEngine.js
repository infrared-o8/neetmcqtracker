/**
 * Loot Engine for Case Drop System
 * Governs drop eligibility, item rolling, and rarity weights.
 */

export const RARITY_TIERS = {
  COMMON: { label: 'Common', chance: 0.65, color: '#71717a', accent: 'zinc' },
  RARE: { label: 'Rare', chance: 0.22, color: '#10b981', accent: 'emerald' },
  EPIC: { label: 'Epic', chance: 0.095, color: '#a855f7', accent: 'amethyst' },
  LEGENDARY: { label: 'Legendary', chance: 0.03, color: '#f59e0b', accent: 'aura' },
  MYTHIC: { label: 'Mythic', chance: 0.005, color: '#ef4444', accent: 'air-apex' },
};

export const LOOT_ITEMS = {
  titles: [
    { id: 't1', label: 'Module Finisher', rarity: 'COMMON' },
    { id: 't2', label: 'NCERT Sweeper', rarity: 'COMMON' },
    { id: 't3', label: 'Backlog Slayer', rarity: 'RARE' },
    { id: 't4', label: 'Formula Alchemist', rarity: 'RARE' },
    { id: 't5', label: '14-Hour Sentinel', rarity: 'EPIC' },
    { id: 't6', label: 'Error Book Devotee', rarity: 'EPIC' },
    { id: 't7', label: '700+ Club Projector', rarity: 'LEGENDARY' },
    { id: 't8', label: 'Star Batch Weapon', rarity: 'LEGENDARY' },
    { id: 't9', label: 'AIR < 100 Catalyst', rarity: 'MYTHIC' },
    { id: 't10', label: 'The Kota Legend', rarity: 'MYTHIC' },
  ],
  frames: [
    { id: 'f1', label: 'Zinc Matte', rarity: 'COMMON', style: 'border-zinc-700 bg-zinc-800/40' },
    { id: 'f2', label: 'Emerald Neon', rarity: 'RARE', style: 'border-emerald-500/40 bg-gradient-to-r from-emerald-900/30 to-teal-950/30' },
    { id: 'f3', label: 'Amethyst Pulse', rarity: 'EPIC', style: 'animate-pulse border-purple-500/50 bg-gradient-to-r from-purple-900/40 via-fuchsia-950/30 to-indigo-900/40' },
    { id: 'f4', label: 'Aura Glow', rarity: 'LEGENDARY', style: 'border-amber-500/70 shadow-[0_0_25px_rgba(245,158,11,0.3)] bg-gradient-to-br from-amber-900/20 to-orange-950/20' },
    { id: 'f5', label: 'Apex Chroma', rarity: 'MYTHIC', style: 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-gradient bg-gradient-to-r from-red-600/20 via-orange-500/20 to-yellow-500/20' },
  ]
};

/** Roll for an item based on weighted probability */
export function rollLoot() {
  const roll = Math.random();
  let cumulative = 0;
  let selectedRarity = 'COMMON';

  // Determine rarity tier
  for (const [tier, data] of Object.entries(RARITY_TIERS)) {
    cumulative += data.chance;
    if (roll <= cumulative) {
      selectedRarity = tier;
      break;
    }
  }

  // Pick type (Title vs Frame)
  const isTitle = Math.random() > 0.5;
  const pool = isTitle ? LOOT_ITEMS.titles : LOOT_ITEMS.frames;
  const tierItems = pool.filter(item => item.rarity === selectedRarity);
  
  // Fallback to lower rarity if no items in current tier pool
  if (tierItems.length === 0) return LOOT_ITEMS.titles[0];

  return {
    ...tierItems[Math.floor(Math.random() * tierItems.length)],
    type: isTitle ? 'title' : 'frame',
    rarityData: RARITY_TIERS[selectedRarity]
  };
}

/** Check if user is eligible for a drop based on AP increment */
export function checkDropEligibility(prevAp, nextAp, devMode = false) {
  const MILESTONE = 120;
  const prevMilestone = Math.floor(prevAp / MILESTONE);
  const nextMilestone = Math.floor(nextAp / MILESTONE);
  
  // 1. AP Milestone Drop
  if (nextMilestone > prevMilestone) return 'ASH_STASH';
  
  // 2. Lucky Instant Drop (0.5% base, 50% in devMode - effectively guaranteed in few taps)
  const luckThreshold = devMode ? 0.5 : 0.005;
  if (Math.random() < luckThreshold) return 'LUCKY_DROP';

  return null;
}
