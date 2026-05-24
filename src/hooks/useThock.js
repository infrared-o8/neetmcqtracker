import { useEffect, useRef, useCallback } from "react";

// Base64 encoded mechanical keyboard switch sound (short, crisp)
const THOCK_SOUND = "data:audio/wav;base64,UklGRl9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU";

export function useThock() {
  const audioRef = useRef(null);

  useEffect(() => {
    // Preload audio
    const audio = new Audio(THOCK_SOUND);
    audio.preload = "auto";
    audio.volume = 0.3;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const playThock = useCallback(() => {
    if (audioRef.current) {
      // Clone and play to allow rapid successive clicks
      const clone = audioRef.current.cloneNode();
      clone.volume = 0.3;
      clone.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, []);

  return playThock;
}
