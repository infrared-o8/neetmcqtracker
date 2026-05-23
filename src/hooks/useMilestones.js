import { useEffect, useRef, useState } from "react";
import { useTrackerStore } from "../store/useTrackerStore";
import { getActivityTotal, getRank } from "../utils/gamification";

const MILESTONE_DEFS = [
  { id: "streak-7", label: "7-Day Streak Unlocked", check: (s) => s.streak >= 7 },
  {
    id: "activity-500",
    label: "500 Activity — Bio-Warhead Pace",
    check: (s) => getActivityTotal(s.totalSolved, s.totalPagesRead, s.studyMinutes) >= 500,
  },
  { id: "pages-100", label: "Century Reader — 100 NCERT Pages", check: (s) => s.totalPagesRead >= 100 },
];

export function useMilestones() {
  const totalSolved = useTrackerStore((s) => s.totalSolved);
  const totalPagesRead = useTrackerStore((s) => s.totalPagesRead);
  const studyMinutes = useTrackerStore((s) => s.studyMinutes);
  const streak = useTrackerStore((s) => s.streak);
  const seenMilestones = useTrackerStore((s) => s.seenMilestones);
  const markSeen = useTrackerStore((s) => s.markMilestoneSeen);
  const [active, setActive] = useState(null);
  const lastRankIndex = useRef(-1);

  useEffect(() => {
    if (active) return;

    const state = { totalSolved, totalPagesRead, studyMinutes, streak };
    const activityTotal = getActivityTotal(totalSolved, totalPagesRead, studyMinutes);
    const { currentIndex, rank } = getRank(activityTotal);

    for (const m of MILESTONE_DEFS) {
      if (m.check(state) && !seenMilestones.includes(m.id)) {
        setActive({ id: m.id, label: m.label });
        return;
      }
    }

    if (currentIndex > lastRankIndex.current && currentIndex > 0) {
      const rankId = `rank-${currentIndex}`;
      if (!seenMilestones.includes(rankId)) {
        setActive({ id: rankId, label: rank.label });
        lastRankIndex.current = currentIndex;
      }
    } else if (lastRankIndex.current < 0) {
      lastRankIndex.current = currentIndex;
    }
  }, [totalSolved, totalPagesRead, studyMinutes, streak, seenMilestones, active]);

  const dismiss = () => {
    if (active) {
      markSeen(active.id);
      setActive(null);
    }
  };

  return { activeMilestone: active, dismissMilestone: dismiss };
}
