import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useLogbookStore = create(
  persist(
    (set) => ({
      fileId: null, // item path or ID
      fileName: "Student Logbook.md",
      lastInsertedLine: 0,
      isLocalMode: true,
      permissionStatus: 'prompt', // 'prompt' | 'granted' | 'denied'
      
      // Dynamic Headers for Subjects
      bioHeader: "## Biology Critical Points",
      chemHeader: "## Chemistry High-Yield",
      phyHeader: "## Physics Formulations",
      mainHeader: "# Final NEET Prep:",

      // Mappings for Quick Insert
      sectionTags: [
        { tag: "bioimportant", id: 'bioHeader', color: "text-emerald-400" },
        { tag: "chemimportant", id: 'chemHeader', color: "text-cyan-400" },
        { tag: "phyimportant", id: 'phyHeader', color: "text-blue-400" },
        { tag: "biopoint", id: 'bioHeader', color: "text-emerald-500" },
        { tag: "chempoint", id: 'chemHeader', color: "text-cyan-500" },
        { tag: "phypoint", id: 'phyHeader', color: "text-blue-500" },
        { tag: "finalprep", id: 'mainHeader', color: "text-rose-400" },
      ],

      setFile: (id, name) => set({ fileId: id, fileName: name }),
      setPermissionStatus: (status) => set({ permissionStatus: status }),
      setLastInsertedLine: (line) => set({ lastInsertedLine: line }),
      setHeaders: (headers) => set((s) => ({ ...s, ...headers })),
      
      updateTags: (tags) => set({ sectionTags: tags }),

      // Sync/Fix tags if they are from an old version (missing IDs)
      syncTags: () => set((state) => {
        const latestTags = [
          { tag: "bioimportant", id: 'bioHeader', color: "text-emerald-400" },
          { tag: "chemimportant", id: 'chemHeader', color: "text-cyan-400" },
          { tag: "phyimportant", id: 'phyHeader', color: "text-blue-400" },
          { tag: "biopoint", id: 'bioHeader', color: "text-emerald-500" },
          { tag: "chempoint", id: 'chemHeader', color: "text-cyan-500" },
          { tag: "phypoint", id: 'phyHeader', color: "text-blue-500" },
          { tag: "finalprep", id: 'mainHeader', color: "text-rose-400" },
        ];
        
        // If current tags are missing the 'id' field or the count is wrong, force update
        const needsUpdate = !state.sectionTags || state.sectionTags.length < latestTags.length || !state.sectionTags[0].id;
        
        if (needsUpdate) {
          console.log("[LogbookStore] Migrating Tags to new ID-based schema...");
          return { ...state, sectionTags: latestTags };
        }
        return state;
      }),
    }),
    {
      name: "neet-logbook-storage",
    }
  )
);
