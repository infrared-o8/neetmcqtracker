import { useEffect, useRef, useState } from "react";
import { getActivityTotal, getRank } from "../utils/gamification";
import { useTrackerStore } from "../store/useTrackerStore";

const PULSE_MS = 8000;

/** True for ~8s after activityTotal crosses into a new rank tier. */
export function useRankUpgradePulse() {
  const totalSolved = useTrackerStore((s) => s.totalSolved);
  const totalPagesRead = useTrackerStore((s) => s.totalPagesRead);
  const studyMinutes = useTrackerStore((s) => s.studyMinutes);
  const [pulsing, setPulsing] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [unlockedLabel, setUnlockedLabel] = useState("");
  const lastIndex = useRef(-1);

  const activityTotal = getActivityTotal(totalSolved, totalPagesRead, studyMinutes);
  const { currentIndex, rank } = getRank(activityTotal);

  useEffect(() => {
    if (lastIndex.current < 0) {
      lastIndex.current = currentIndex;
      return;
    }
    if (currentIndex > lastIndex.current) {
      lastIndex.current = currentIndex;
      setUnlockedLabel(rank.label);
      setPulsing(true);
      setPulseKey((k) => k + 1);
      const t = window.setTimeout(() => setPulsing(false), PULSE_MS);
      return () => window.clearTimeout(t);
    }
    lastIndex.current = currentIndex;
  }, [currentIndex, rank.label]);

  const dismiss = () => setPulsing(false);

  return {
    pulsing,
    pulseKey,
    rankIndex: currentIndex,
    rankLabel: unlockedLabel || rank.label,
    dismiss,
  };
}
