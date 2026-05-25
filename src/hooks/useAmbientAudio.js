import { useEffect, useRef, useCallback } from "react";
import { useTrackerStore } from "../store/useTrackerStore";

const TRACKS = {
  lofi: { freq: 220, type: "sine" },
  rain: { noise: true },
  noise: { noise: true, white: true },
  synth: { freq: 110, type: "sawtooth" },
};

// Singleton context to avoid multiple AudioContext errors
let sharedCtx = null;
function getSharedCtx() {
  if (!sharedCtx) {
    sharedCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedCtx;
}

export function useAmbientAudio() {
  const track = useTrackerStore((s) => s.preferences.ambientTrack);
  const soundEnabled = useTrackerStore((s) => s.preferences.soundEnabled);
  const nodesRef = useRef(null);

  const playThock = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = getSharedCtx();
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Quiet fail to avoid console noise
    }
  }, [soundEnabled]);

  useEffect(() => {
    const stop = () => {
      nodesRef.current?.forEach((n) => {
        try {
          n.stop?.();
          n.disconnect?.();
        } catch { /* */ }
      });
      nodesRef.current = null;
    };

    if (!track || track === "off" || track === "youtube") {
      stop();
      return stop;
    }

    const cfg = TRACKS[track];
    if (!cfg) return stop;

    // Use shared context
    const ctx = getSharedCtx();
    if (ctx.state === 'suspended') {
      // Cannot auto-resume without gesture, but we can setup the nodes
    }
    
    const nodes = [];
    const gain = ctx.createGain();
    gain.gain.value = track === "noise" ? 0.04 : 0.03;
    gain.connect(ctx.destination);
    nodes.push(gain);

    if (cfg.noise) {
      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (cfg.white ? 1 : 0.5);
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start();
      nodes.push(source);
    } else {
      const osc = ctx.createOscillator();
      osc.type = cfg.type || "sine";
      osc.frequency.value = cfg.freq;
      osc.connect(gain);
      osc.start();
      nodes.push(osc);
    }

    nodesRef.current = nodes;
    return stop;
  }, [track]);

  return { playThock };
}
