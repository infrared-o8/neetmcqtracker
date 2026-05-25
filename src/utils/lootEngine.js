/**
 * Loot Engine for Case Drop System
 * Governs drop eligibility, item rolling, and rarity weights.
 */

import { FRAMES } from '../data/profileDecor';

export const RARITY_TIERS = {
  common: { label: 'Common', chance: 0.65, color: '#71717a', accent: 'zinc' },
  rare: { label: 'Rare', chance: 0.22, color: '#10b981', accent: 'emerald' },
  epic: { label: 'Epic', chance: 0.095, color: '#a855f7', accent: 'amethyst' },
  legendary: { label: 'Legendary', chance: 0.03, color: '#f59e0b', accent: 'aura' },
  mythic: { label: 'Mythic', chance: 0.005, color: '#ef4444', accent: 'air-apex' },
};

// Build the frames array directly from the FRAMES dictionary to keep a single source of truth
const frameItems = Object.entries(FRAMES).map(([id, data]) => ({
  id,
  label: data.name || id.toUpperCase(), // Using ID if name is missing
  rarity: data.rarity,
  style: `${data.border} ${data.glow}`
}));

export const LOOT_ITEMS = {
  titles: [
    { id: 't1', label: 'Module Finisher', rarity: 'common' },
    { id: 't2', label: 'NCERT Sweeper', rarity: 'common' },
    { id: 't3', label: 'Backlog Slayer', rarity: 'rare' },
    { id: 't4', label: 'Formula Alchemist', rarity: 'rare' },
    { id: 't5', label: '14-Hour Sentinel', rarity: 'epic' },
    { id: 't6', label: 'Error Book Devotee', rarity: 'epic' },
    { id: 't7', label: '700+ Club Projector', rarity: 'legendary' },
    { id: 't8', label: 'Star Batch Weapon', rarity: 'legendary' },
    { id: 't9', label: 'AIR < 100 Catalyst', rarity: 'mythic' },
    { id: 't10', label: 'The Kota Legend', rarity: 'mythic' },
  ],
  frames: frameItems
};

/** Roll for an item based on weighted probability */
export function rollLoot() {
  const roll = Math.random();
  let cumulative = 0;
  let selectedRarity = 'common';

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
