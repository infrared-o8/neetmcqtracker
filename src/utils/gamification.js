const DAY_MS = 24 * 60 * 60 * 1000;

export const RANKS = [
  { label: "Beginner", minSolved: 0 },
  { label: "Warmup Solver", minSolved: 100 },
  { label: "Foundation Builder", minSolved: 300 },
  { label: "Consistency Cadet", minSolved: 600 },
  { label: "Aspirant", minSolved: 1000 },
  { label: "Question Grinder", minSolved: 1500 },
  { label: "Syllabus Tracker", minSolved: 2200 },
  { label: "Module Finisher", minSolved: 3000 },
  { label: "Revision Regular", minSolved: 4000 },
  { label: "Error Book Disciplined", minSolved: 5200 },
  { label: "Major Test Competitor", minSolved: 6600 },
  { label: "Ranker Marks Pace", minSolved: 8200 },
  { label: "State Challenger Track", minSolved: 10000 },
  { label: "Top 25K Projected", minSolved: 12000 },
  { label: "Top 15K Projected", minSolved: 14200 },
  { label: "Top 10K Projected", minSolved: 16600 },
  { label: "Top 5K Projected", minSolved: 19200 },
  { label: "Top 3K Projected", minSolved: 22000 },
  { label: "Top 2K Projected", minSolved: 25000 },
  { label: "Top 1K Target", minSolved: 28200 },
  { label: "AIR < 750 Bracket", minSolved: 31600 },
  { label: "AIR < 500 Bracket", minSolved: 35200 },
  { label: "AIR < 300 Bracket", minSolved: 39000 },
  { label: "AIR < 200 Bracket", minSolved: 43000 },
  { label: "AIR < 100 Bracket", minSolved: 47200 },
  { label: "AIR < 50 Elite", minSolved: 51600 },
  { label: "Elite Star Batch Pace", minSolved: 56200 },
  { label: "Special Rankers Group", minSolved: 61000 },
  { label: "National Benchmark Leader", minSolved: 66000 },
  { label: "AIR Apex Trajectory", minSolved: 71200 },
];


/** Each verified face-study minute adds half an activity point (MCQ/page equivalent). */
export const STUDY_MINUTE_ACTIVITY = 0.5;

export function getStudyActivityBonus(studyMinutes = 0) {
  return studyMinutes * STUDY_MINUTE_ACTIVITY;
}

export function getActivityTotal(totalSolved, totalPagesRead = 0, studyMinutes = 0) {
  return totalSolved + totalPagesRead + getStudyActivityBonus(studyMinutes);
}

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function dayDiff(from, to) {
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  return Math.floor((toDate.getTime() - fromDate.getTime()) / DAY_MS);
}

export function getXpNeeded(level) {
  return Math.floor(50 * level ** 1.2);
}

export function getLevelFromXp(xp) {
  let level = 1;
  let remainingXp = xp;
  while (remainingXp >= getXpNeeded(level)) {
    remainingXp -= getXpNeeded(level);
    level += 1;
  }
  return {
    level,
    xpIntoLevel: remainingXp,
    xpForNextLevel: getXpNeeded(level),
  };
}

export function getRank(activityTotal) {
  const currentIndex = RANKS.reduce((best, rank, index) => {
    if (activityTotal >= rank.minSolved) {
      return index;
    }
    return best;
  }, 0);
  return { rank: RANKS[currentIndex], currentIndex };
}

export function getRankProgress(activityTotal) {
  const { rank, currentIndex } = getRank(activityTotal);
  const nextRank = RANKS[currentIndex + 1] ?? null;

  if (!nextRank) {
    return {
      currentRank: rank,
      nextRank: null,
      progressPercent: 100,
      progressInTier: 0,
      tierSpan: 0,
      remainingToNext: 0,
    };
  }

  const progressInTier = Math.max(activityTotal - rank.minSolved, 0);
  const tierSpan = Math.max(nextRank.minSolved - rank.minSolved, 1);
  const progressPercent = Math.min((progressInTier / tierSpan) * 100, 100);

  return {
    currentRank: rank,
    nextRank,
    progressPercent,
    progressInTier,
    tierSpan,
    remainingToNext: Math.max(nextRank.minSolved - activityTotal, 0),
  };
}

export function getAllRanksProgress(activityTotal) {
  return RANKS.map((rank, index) => {
    const achieved = activityTotal >= rank.minSolved;
    const nextRank = RANKS[index + 1] ?? null;

    // Progress toward UNLOCKING this specific rank
    const progressPercent =
      rank.minSolved === 0
        ? 100
        : Math.min((activityTotal / rank.minSolved) * 100, 100);

    return {
      label: rank.label,
      minSolved: rank.minSolved,
      achieved,
      current: achieved && (!nextRank || activityTotal < nextRank.minSolved),
      progressPercent,
      remaining: Math.max(rank.minSolved - activityTotal, 0),
    };
  });
}

export function getHeatmapScore(mcqs = 0, pages = 0) {
  return mcqs + pages * 5;
}

export function getHeatmapIntensity(score) {
  if (score <= 0) return 0;
  if (score < 10) return 1;
  if (score < 50) return 2;
  if (score < 100) return 3;
  return 4;
}

export function getHeatmapColorClass(intensity) {
  const map = [
    "bg-zinc-800/40",
    "bg-violet-500/25",
    "bg-violet-500/50",
    "bg-violet-600/75",
    "bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]",
  ];
  return map[intensity] ?? map[0];
}

export function getMotivationMessage({
  todaySolved,
  todayPages,
  streak,
  activityTotal,
  dailyGoal,
  dailyPageGoal,
  trackingMode,
}) {
  const today = trackingMode === "pages" ? todayPages : todaySolved;
  const goal = trackingMode === "pages" ? dailyPageGoal : dailyGoal;
  if (today >= goal && goal > 0) {
    return trackingMode === "pages"
      ? "Page goal crushed. NCERT momentum is real."
      : "Goal smashed. You are building AIR < 100 momentum.";
  }
  if (streak >= 14) {
    return "Consistency beats talent. Your streak is elite.";
  }
  if (todaySolved >= 80 || todayPages >= 15) {
    return "You're ahead of most aspirants today.";
  }
  if (activityTotal >= 2500) {
    return "AIR < 500 pace unlocked. Keep stacking clean days.";
  }
  if (today === 0) {
    return "One focused session now can rescue the day.";
  }
  return trackingMode === "pages"
    ? "Every page compounds. Keep the rhythm."
    : "Keep the rhythm. Every MCQ compounds your rank.";
}

export function getRollingMcqSpeed(timestamps) {
  if (!timestamps || timestamps.length < 2) {
    return 0;
  }
  const start = timestamps[0];
  const end = timestamps[timestamps.length - 1];
  const elapsedHours = Math.max((end - start) / (1000 * 60 * 60), 1 / 3600);
  return Math.round((timestamps.length - 1) / elapsedHours);
}

export function buildContributionDays(dailyLogs, dailyPageLogs, weeks = 52) {
  const today = new Date();
  const days = weeks * 7;
  return Array.from({ length: days }, (_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - idx - 1));
    const key = d.toISOString().slice(0, 10);
    const mcqs = dailyLogs[key] ?? 0;
    const pages = dailyPageLogs[key] ?? 0;
    const score = getHeatmapScore(mcqs, pages);
    return { key, mcqs, pages, score, intensity: getHeatmapIntensity(score) };
  });
}
