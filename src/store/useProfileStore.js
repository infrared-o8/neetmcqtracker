import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_DECOR } from "../data/profileDecor";

function generatePlayerId() {
  return crypto.randomUUID?.() ?? `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const initialState = {
  playerId: "",
  displayName: "Aspirant",
  decor: { ...DEFAULT_DECOR },
  lastSyncedAt: 0,
  unlockedItems: [], // Array of { id, type, label, rarity, style }
  pendingCrates: [], // Queue of strings e.g. ['ASH_STASH', 'STAR_BATCH']
  totalCratesOpened: 0,
};

export const useProfileStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      ensurePlayerId: () => {
        if (!get().playerId) {
          set({ playerId: generatePlayerId() });
        }
      },
      setDisplayName: (displayName) => set({ displayName }),
      setDecor: (partial) =>
        set((s) => ({
          decor: { ...s.decor, ...partial },
        })),
      setLastSyncedAt: (ts) => set({ lastSyncedAt: ts }),
      addUnlockedItem: (item) => set((state) => ({
        unlockedItems: [...state.unlockedItems, item],
        totalCratesOpened: state.totalCratesOpened + 1
      })),
      addPendingCrate: (crateType) => set((state) => ({
        pendingCrates: [...state.pendingCrates, crateType]
      })),
      removeFirstPendingCrate: () => set((state) => ({
        pendingCrates: state.pendingCrates.slice(1)
      })),
    }),
    {
      name: "neet-tracker-profile-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        playerId: s.playerId,
        displayName: s.displayName,
        decor: s.decor,
        lastSyncedAt: s.lastSyncedAt,
        unlockedItems: s.unlockedItems,
        pendingCrates: s.pendingCrates,
        totalCratesOpened: s.totalCratesOpened,
      }),
    },
  ),
);
