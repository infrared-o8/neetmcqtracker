import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLiveRoomStore = create(
  persist(
    (set) => ({
      pinnedUsers: [], // Array of identity strings (max 3)
      currentTask: '',
      videoResolution: 'high', // 'high' | 'low'
      mirrorVideo: true,
      isBreakMode: false,
      isCamOff: false,

      togglePin: (identity) => set((state) => {
        const isPinned = state.pinnedUsers.includes(identity);
        if (isPinned) {
          return { pinnedUsers: state.pinnedUsers.filter((id) => id !== identity) };
        }
        if (state.pinnedUsers.length >= 3) {
          return { pinnedUsers: [...state.pinnedUsers.slice(1), identity] };
        }
        return { pinnedUsers: [...state.pinnedUsers, identity] };
      }),

      setCurrentTask: (task) => set({ currentTask: task }),
      setVideoResolution: (res) => set({ videoResolution: res }),
      setMirrorVideo: (mirror) => set({ mirrorVideo: mirror }),
      setBreakMode: (breakMode) => set({ isBreakMode: breakMode }),
      setCamOff: (camOff) => set({ isCamOff: camOff }),
    }),
    {
      name: 'live-room-storage',
      partialize: (state) => ({
        videoResolution: state.videoResolution,
        mirrorVideo: state.mirrorVideo,
      }),
    }
  )
);
