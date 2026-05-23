const DAY_MS = 24 * 60 * 60 * 1000;

export const RANKS = [
  { label: "Beginner", minSolved: 0 },
  { label: "Warmup Solver", minSolved: 25 },
  { label: "Foundation Builder", minSolved: 60 },
  { label: "Consistency Cadet", minSolved: 120 },
  { label: "Aspirant", minSolved: 200 },
  { label: "Question Grinder", minSolved: 320 },
  { label: "Ranker", minSolved: 480 },
  { label: "State Challenger", minSolved: 700 },
  { label: "Top 25K Pace", minSolved: 950 },
  { label: "Top 10K Pace", minSolved: 1250 },
  { label: "Top 5K Pace", minSolved: 1650 },
  { label: "Top 2K Pace", minSolved: 2100 },
  { label: "Top 1K", minSolved: 2700 },
  { label: "AIR < 750", minSolved: 3400 },
  { label: "AIR < 500", minSolved: 4200 },
  { label: "AIR < 300", minSolved: 5100 },
  { label: "AIR < 200", minSolved: 6200 },
  { label: "AIR < 100", minSolved: 7500 },
  { label: "Neural Overclock", minSolved: 9000 },
  { label: "Synaptic Storm", minSolved: 11000 },
  { label: "Bio-Warhead", minSolved: 13500 },
  { label: "Quantum Grinder", minSolved: 16500 },
  { label: "Mythic Aspirant", minSolved: 20000 },
  { label: "AIR Apex", minSolved: 25000 },
];

export function getActivityTotal(totalSolved, totalPagesRead = 0) {
  return totalSolved + totalPagesRead;
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
    const nextRank = RANKS[index + 1] ?? null;
    const achieved = activityTotal >= rank.minSolved;
    if (!nextRank) {
      return {
        label: rank.label,
        minSolved: rank.minSolved,
        achieved,
        progressPercent: achieved ? 100 : 0,
        remaining: 0,
      };
    }
    const tierSpan = nextRank.minSolved - rank.minSolved;
    const progressInTier = Math.max(activityTotal - rank.minSolved, 0);
    const progressPercent = achieved
      ? activityTotal >= nextRank.minSolved
        ? 100
        : Math.min((progressInTier / tierSpan) * 100, 100)
      : 0;
    return {
      label: rank.label,
      minSolved: rank.minSolved,
      achieved: activityTotal >= nextRank.minSolved,
      current: activityTotal >= rank.minSolved && activityTotal < nextRank.minSolved,
      progressPercent,
      remaining: Math.max(nextRank.minSolved - activityTotal, 0),
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
