import { useEffect, useRef, useCallback } from "react";
import { useTrackerStore } from "../store/useTrackerStore";

// Base64 encoded mechanical keyboard switch sound (short, crisp)
const THOCK_SOUND = "data:audio/wav;base64,UklGRm9vT1BXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU5vVFBXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="; // Note: In a real app, this would be a full valid base64 or path. Using a representative short click.

export function useThock() {
  const soundEnabled = useTrackerStore((s) => s.preferences.soundEnabled);
  const audioRef = useRef(null);

  useEffect(() => {
    // Preload audio
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3"); // Using a real snappy click SFX
    audio.preload = "auto";
    audio.volume = 0.25;
    audioRef.current = audio;

    return () => {
      audioRef.current = null;
    };
  }, []);

  const playThock = useCallback(() => {
    if (!soundEnabled || !audioRef.current) return;
    
    try {
      const clone = audioRef.current.cloneNode();
      clone.volume = 0.25;
      clone.play().catch(() => {});
    } catch (e) {
      // Ignore
    }
  }, [soundEnabled]);

  return playThock;
}
