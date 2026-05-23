import { useEffect, useRef, useState } from "react";
import { getActivityTotal, getRank } from "../utils/gamification";
import { useTrackerStore } from "../store/useTrackerStore";

/** True for ~4s after activityTotal crosses into a new rank tier. */
export function useRankUpgradePulse() {
  const totalSolved = useTrackerStore((s) => s.totalSolved);
  const totalPagesRead = useTrackerStore((s) => s.totalPagesRead);
  const [pulsing, setPulsing] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const lastIndex = useRef(-1);

  const activityTotal = getActivityTotal(totalSolved, totalPagesRead);
  const { currentIndex, rank } = getRank(activityTotal);

  useEffect(() => {
    if (lastIndex.current < 0) {
      lastIndex.current = currentIndex;
      return;
    }
    if (currentIndex > lastIndex.current) {
      lastIndex.current = currentIndex;
      setPulsing(true);
      setPulseKey((k) => k + 1);
      const t = window.setTimeout(() => setPulsing(false), 4200);
      return () => window.clearTimeout(t);
    }
    lastIndex.current = currentIndex;
  }, [currentIndex]);

  return { pulsing, pulseKey, rankIndex: currentIndex, rankLabel: rank.label };
}
