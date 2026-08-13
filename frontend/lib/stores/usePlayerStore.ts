import { create } from "zustand";

interface PlayerState {
  currentTimeMs: number;
  isPlaying: boolean;
  durationMs: number;
  seekRequestMs: number | null;
  
  setCurrentTimeMs: (ms: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setDurationMs: (ms: number) => void;
  seekTo: (ms: number) => void;
  clearSeekRequest: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentTimeMs: 0,
  isPlaying: false,
  durationMs: 0,
  seekRequestMs: null,
  
  setCurrentTimeMs: (ms) => set({ currentTimeMs: ms }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setDurationMs: (ms) => set({ durationMs: ms }),
  seekTo: (ms) => set({ seekRequestMs: ms }),
  clearSeekRequest: () => set({ seekRequestMs: null }),
}));
