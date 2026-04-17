const DAY_MS = 24 * 60 * 60 * 1000;

export const RANKS = [
  { label: "Beginner", minSolved: 0 },
  { label: "Warmup Solver", minSolved: 30 },
  { label: "Foundation Builder", minSolved: 80 },
  { label: "Consistency Cadet", minSolved: 150 },
  { label: "Aspirant", minSolved: 250 },
  { label: "Question Grinder", minSolved: 400 },
  { label: "Ranker", minSolved: 650 },
  { label: "State Challenger", minSolved: 950 },
  { label: "Top 25K Pace", minSolved: 1300 },
  { label: "Top 10K Pace", minSolved: 1750 },
  { label: "Top 5K Pace", minSolved: 2300 },
  { label: "Top 2K Pace", minSolved: 3000 },
  { label: "Top 1K", minSolved: 3800 },
  { label: "AIR < 750", minSolved: 4700 },
  { label: "AIR < 500", minSolved: 5600 },
  { label: "AIR < 300", minSolved: 6800 },
  { label: "AIR < 200", minSolved: 8200 },
  { label: "AIR < 100", minSolved: 10000 },
];

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

export function getRank(totalSolved) {
  const currentIndex = RANKS.reduce((best, rank, index) => {
    if (totalSolved >= rank.minSolved) {
      return index;
    }
    return best;
  }, 0);
  return { rank: RANKS[currentIndex], currentIndex };
}

export function getRankProgress(totalSolved) {
  const { rank, currentIndex } = getRank(totalSolved);
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

  const progressInTier = Math.max(totalSolved - rank.minSolved, 0);
  const tierSpan = Math.max(nextRank.minSolved - rank.minSolved, 1);
  const progressPercent = Math.min((progressInTier / tierSpan) * 100, 100);

  return {
    currentRank: rank,
    nextRank,
    progressPercent,
    progressInTier,
    tierSpan,
    remainingToNext: Math.max(nextRank.minSolved - totalSolved, 0),
  };
}

export function getMotivationMessage({ todaySolved, streak, totalSolved, dailyGoal }) {
  if (todaySolved >= dailyGoal && dailyGoal > 0) {
    return "Goal smashed. You are building AIR < 100 momentum.";
  }
  if (streak >= 14) {
    return "Consistency beats talent. Your streak is elite.";
  }
  if (todaySolved >= 80) {
    return "You're ahead of 80% of aspirants today.";
  }
  if (totalSolved >= 2500) {
    return "AIR < 500 pace unlocked. Keep stacking clean days.";
  }
  if (todaySolved === 0) {
    return "One focused session now can rescue the day.";
  }
  return "Keep the rhythm. Every MCQ compounds your rank.";
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
