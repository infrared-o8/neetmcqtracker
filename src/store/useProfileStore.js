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
    }),
    {
      name: "neet-tracker-profile-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        playerId: s.playerId,
        displayName: s.displayName,
        decor: s.decor,
        lastSyncedAt: s.lastSyncedAt,
      }),
    },
  ),
);
