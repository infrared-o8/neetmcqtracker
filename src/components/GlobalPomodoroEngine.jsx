import { useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { useTrackerStore } from "../store/useTrackerStore";

export function GlobalPomodoroEngine() {
  const pState = useTrackerStore(s => s.pomodoroState);
  const setPState = useTrackerStore(s => s.setPomodoroState);
  const addStudyMinute = useTrackerStore(s => s.addStudyMinute);
  const addPomodoroSession = useTrackerStore(s => s.addPomodoroSession);
  const preferences = useTrackerStore(s => s.preferences);

  const focusMinutes = preferences.pomodoroFocusMinutes || 25;
  const breakMinutes = preferences.pomodoroBreakMinutes || 5;

  const isActive = pState.isActive;
  const isBreak = pState.isBreak;
  const secondsLeft = pState.secondsLeft;

  const timerRef = useRef(null);
  const minuteTrackerRef = useRef(0);
  const hasHydrated = useRef(false);

  // One-time hydration sync to fix the "stuck at 25 default" bug on refresh
  useEffect(() => {
    if (!hasHydrated.current) {
      if (!isActive && !isBreak && secondsLeft === 1500 && focusMinutes !== 25) {
        setPState({ secondsLeft: focusMinutes * 60 });
      }
      hasHydrated.current = true;
    }
  }, [isActive, isBreak, secondsLeft, focusMinutes, setPState]);

  const triggerConfetti = useCallback(() => {
    const duration = 2 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    const randomInRange = (min, max) => Math.random() * (max - min) + min;

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  const enterBreak = useCallback(() => {
    addPomodoroSession({ type: 'focus', duration: focusMinutes });
    setPState({ isBreak: true, isActive: false, secondsLeft: breakMinutes * 60 });
    minuteTrackerRef.current = 0;
  }, [addPomodoroSession, focusMinutes, breakMinutes, setPState]);

  const exitBreak = useCallback(() => {
    addPomodoroSession({ type: 'break', duration: breakMinutes });
    setPState({ isBreak: false, isActive: false, secondsLeft: focusMinutes * 60 });
    minuteTrackerRef.current = 0;
  }, [addPomodoroSession, focusMinutes, breakMinutes, setPState]);

  // Global Engine Tick
  useEffect(() => {
    if (isActive && secondsLeft > 0) {
      timerRef.current = setInterval(() => {
        const currentSecs = useTrackerStore.getState().pomodoroState.secondsLeft;
        
        if (currentSecs <= 1) {
          clearInterval(timerRef.current);
          setPState({ isActive: false, secondsLeft: 0 });
          triggerConfetti();
          if (!isBreak) enterBreak();
          else exitBreak();
          return;
        }

        setPState({ secondsLeft: currentSecs - 1 });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isBreak, enterBreak, exitBreak, triggerConfetti, setPState]);

  return null;
}
