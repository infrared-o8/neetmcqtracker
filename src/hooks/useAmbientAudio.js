import { useEffect, useRef } from "react";
import { useTrackerStore } from "../store/useTrackerStore";

const TRACKS = {
  lofi: { freq: 220, type: "sine" },
  rain: { noise: true },
  noise: { noise: true, white: true },
  synth: { freq: 110, type: "sawtooth" },
};

export function useAmbientAudio() {
  const track = useTrackerStore((s) => s.preferences.ambientTrack);
  const nodesRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    const stop = () => {
      nodesRef.current?.forEach((n) => {
        try {
          n.stop?.();
          n.disconnect?.();
        } catch {
          /* */
        }
      });
      nodesRef.current = null;
      if (ctxRef.current?.state !== "closed") {
        ctxRef.current?.close?.();
      }
      ctxRef.current = null;
    };

    if (!track || track === "off" || track === "youtube") {
      stop();
      return stop;
    }

    const cfg = TRACKS[track];
    if (!cfg) return stop;

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    ctxRef.current = ctx;
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
}
