import { useCallback, useRef } from "react";
import { useTrackerStore } from "../store/useTrackerStore";

// Share context across all reward sounds
let rewardAudioCtx = null;
function getRewardCtx() {
  if (!rewardAudioCtx) {
    rewardAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return rewardAudioCtx;
}

function playTone({ freq = 440, duration = 0.08, type = "square", gain = 0.08 }) {
  try {
    const ctx = getRewardCtx();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.stop(ctx.currentTime + duration);
  } catch {
    /* ignore */
  }
}

export function useMicroRewards() {
  const soundEnabled = useTrackerStore((s) => s.preferences.soundEnabled);
  const hapticsEnabled = useTrackerStore((s) => s.preferences.hapticsEnabled);

  const unlock = useCallback(() => {
    const ctx = getRewardCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  }, []);

  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    playTone({ freq: 880, duration: 0.06, type: "square", gain: 0.06 });
  }, [soundEnabled]);

  const playLevelUp = useCallback(() => {
    if (!soundEnabled) return;
    playTone({ freq: 523, duration: 0.1, type: "sine", gain: 0.1 });
    setTimeout(() => playTone({ freq: 784, duration: 0.12, type: "sine", gain: 0.1 }), 80);
  }, [soundEnabled]);

  const vibrate = useCallback(() => {
    if (hapticsEnabled && navigator.vibrate) {
      navigator.vibrate(12);
    }
  }, [hapticsEnabled]);

  const onIncrement = useCallback(() => {
    playClick();
    vibrate();
  }, [playClick, vibrate]);

  return { playClick, playLevelUp, vibrate, onIncrement, unlock };
}
