import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  dayDiff,
  getActivityTotal,
  getLevelFromXp,
  getRank,
  getTodayKey,
} from "../utils/gamification";

const DEFAULT_PREFERENCES = {
  soundEnabled: true,
  hapticsEnabled: true,
  ambientTrack: "off",
  serverUrl: "",
  youtubeAudioUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk", // Lofi default
  youtubeVideoUrl: "https://www.youtube.com/watch?v=5wT8S8pT7h0", // Aesthetic study background
  bgVideoEnabled: true,
  uiOptimized: false,
  showAiSelfView: true,
  disableAnimations: false,
  devModeEnabled: false,
  currentWork: "",
  cozyPreset: "default",
};

export const initialState = {
  totalSolved: 0,
  totalPagesRead: 0,
  dailyLogs: {},
  dailyPageLogs: {},
  streak: 0,
  bestStreak: 0,
  lastActiveDate: "",
  xp: 0,
  level: 1,
  dailyGoal: 120,
  dailyPageGoal: 20,
  goalCompletedToday: false,
  pageGoalCompletedToday: false,
  trackingMode: "mcq",
  mcqTimestamps: [],
  pageTimestamps: [],
  momentumChain: 0,
  bestMomentumChain: 0,
  lastMcqAt: 0,
  lastPageAt: 0,
  breakWarning: false,
  velocityTarget: 60,
  seenMilestones: [],
  studyMinutes: 0,
  studyMinutesToday: 0,
  studyMinutesDate: "",
  preferences: { ...DEFAULT_PREFERENCES },
  minimizedWidgets: [],
  session: {
    active: false,
    durationMinutes: 0,
    startAt: 0,
    endAt: 0,
    startSolved: 0,
  },
  lastSessionSummary: null,
};

const BREAK_MS = 10 * 60 * 1000;
const SPEED_WINDOW_SIZE = 20;

function hadActivityOnDate(state, dateKey) {
  return (state.dailyLogs[dateKey] ?? 0) > 0 || (state.dailyPageLogs[dateKey] ?? 0) > 0;
}

function applyRollover(state) {
  const today = getTodayKey();
  if (!state.lastActiveDate) {
    return { ...state, lastActiveDate: today };
  }
  if (state.lastActiveDate === today) {
    return state;
  }

  const gap = dayDiff(state.lastActiveDate, today);
  if (gap > 1) {
    return {
      ...state,
      streak: 0,
      lastActiveDate: today,
      goalCompletedToday: false,
      pageGoalCompletedToday: false,
    };
  }

  const hadActivity = hadActivityOnDate(state, state.lastActiveDate);
  return {
    ...state,
    streak: hadActivity ? state.streak : 0,
    lastActiveDate: today,
    goalCompletedToday: false,
    pageGoalCompletedToday: false,
  };
}

function applyActivityIncrement(state, { type, amount }) {
  const today = getTodayKey();
  const now = Date.now();
  const rolled = applyRollover(state);
  const isMcq = type === "mcq";

  const prevTodayMcq = rolled.dailyLogs[today] ?? 0;
  const prevTodayPages = rolled.dailyPageLogs[today] ?? 0;
  const hadAnyToday = prevTodayMcq > 0 || prevTodayPages > 0;

  const nextXp = rolled.xp + amount;
  const levelState = getLevelFromXp(nextXp);
  const nextStreak = !hadAnyToday ? rolled.streak + 1 : rolled.streak;

  let next = {
    ...rolled,
    xp: nextXp,
    level: levelState.level,
    streak: nextStreak,
    bestStreak: Math.max(rolled.bestStreak, nextStreak),
    lastActiveDate: today,
    breakWarning: false,
  };

  if (isMcq) {
    const nextToday = prevTodayMcq + amount;
    const freshTimestamps = [...rolled.mcqTimestamps, ...Array(amount).fill(now)].slice(
      -SPEED_WINDOW_SIZE,
    );
    const continuingMomentum =
      rolled.lastMcqAt > 0 && now - rolled.lastMcqAt <= BREAK_MS;
    const nextMomentum = continuingMomentum ? rolled.momentumChain + amount : amount;

    next = {
      ...next,
      dailyLogs: { ...rolled.dailyLogs, [today]: nextToday },
      totalSolved: rolled.totalSolved + amount,
      lastMcqAt: now,
      mcqTimestamps: freshTimestamps,
      momentumChain: nextMomentum,
      bestMomentumChain: Math.max(rolled.bestMomentumChain, nextMomentum),
      goalCompletedToday:
        rolled.goalCompletedToday ||
        (rolled.dailyGoal > 0 && nextToday >= rolled.dailyGoal),
    };
  } else {
    const nextToday = prevTodayPages + amount;
    const freshTimestamps = [...rolled.pageTimestamps, ...Array(amount).fill(now)].slice(
      -SPEED_WINDOW_SIZE,
    );
    const continuingMomentum =
      rolled.lastPageAt > 0 && now - rolled.lastPageAt <= BREAK_MS;
    const nextMomentum = continuingMomentum ? rolled.momentumChain + amount : amount;

    next = {
      ...next,
      dailyPageLogs: { ...rolled.dailyPageLogs, [today]: nextToday },
      totalPagesRead: rolled.totalPagesRead + amount,
      lastPageAt: now,
      pageTimestamps: freshTimestamps,
      momentumChain: nextMomentum,
      bestMomentumChain: Math.max(rolled.bestMomentumChain, nextMomentum),
      pageGoalCompletedToday:
        rolled.pageGoalCompletedToday ||
        (rolled.dailyPageGoal > 0 && nextToday >= rolled.dailyPageGoal),
    };
  }

  return next;
}

function loadV1State() {
  try {
    const raw = localStorage.getItem("neet-mcq-tracker-pro-v1");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.state ?? parsed;
  } catch {
    return null;
  }
}

export const useTrackerStore = create(
  persist(
    (set, get) => ({
      ...initialState,
      ensureToday: () => set((current) => applyRollover(current)),
      setTrackingMode: (trackingMode) => set({ trackingMode }),
      addMcq: (amount = 1) =>
        set((current) => applyActivityIncrement(current, { type: "mcq", amount })),
      addPages: (amount = 1) =>
        set((current) => applyActivityIncrement(current, { type: "pages", amount })),
      setDailyGoal: (goal) =>
        set((state) => {
          const today = getTodayKey();
          const todaySolved = state.dailyLogs[today] ?? 0;
          return {
            dailyGoal: goal,
            goalCompletedToday: goal > 0 && todaySolved >= goal,
          };
        }),
      setDailyPageGoal: (goal) =>
        set((state) => {
          const today = getTodayKey();
          const todayPages = state.dailyPageLogs[today] ?? 0;
          return {
            dailyPageGoal: goal,
            pageGoalCompletedToday: goal > 0 && todayPages >= goal,
          };
        }),
      setPreferences: (partial) =>
        set((s) => ({
          preferences: { ...s.preferences, ...partial },
        })),
      toggleMinimized: (id) =>
        set((s) => ({
          minimizedWidgets: s.minimizedWidgets.includes(id)
            ? s.minimizedWidgets.filter((w) => w !== id)
            : [...s.minimizedWidgets, id],
        })),
      markMilestoneSeen: (id) =>
        set((s) => ({
          seenMilestones: s.seenMilestones.includes(id)
            ? s.seenMilestones
            : [...s.seenMilestones, id],
        })),
      setVelocityTarget: (target) => set({ velocityTarget: target }),
      startSession: (durationMinutes) =>
        set((state) => {
          const now = Date.now();
          return {
            session: {
              active: true,
              durationMinutes,
              startAt: now,
              endAt: now + durationMinutes * 60 * 1000,
              startSolved: state.totalSolved,
            },
            lastSessionSummary: null,
          };
        }),
      endSession: () =>
        set((state) => {
          if (!state.session.active) return state;
          const now = Date.now();
          const elapsedMinutes = Math.max((now - state.session.startAt) / (1000 * 60), 1 / 60);
          const solved = Math.max(state.totalSolved - state.session.startSolved, 0);
          return {
            ...state,
            session: {
              active: false,
              durationMinutes: 0,
              startAt: 0,
              endAt: 0,
              startSolved: 0,
            },
            lastSessionSummary: {
              solved,
              elapsedMinutes: Math.round(elapsedMinutes),
              speed: Math.round(solved / (elapsedMinutes / 60)),
              endedAt: now,
            },
          };
        }),
      checkInactivity: () =>
        set((state) => {
          const now = Date.now();
          const lastAt =
            state.trackingMode === "pages" ? state.lastPageAt : state.lastMcqAt;
          const shouldWarn = lastAt > 0 && now - lastAt >= BREAK_MS;
          const shouldEndSession = state.session.active && now >= state.session.endAt;
          const breakWarningChanged = shouldWarn !== state.breakWarning;
          const shouldResetMomentum = shouldWarn && state.momentumChain !== 0;
          if (!breakWarningChanged && !shouldResetMomentum && !shouldEndSession) {
            return state;
          }

          let next = {
            ...state,
            breakWarning: shouldWarn,
            momentumChain: shouldWarn ? 0 : state.momentumChain,
          };

          if (shouldEndSession) {
            const elapsedMinutes = Math.max(
              (state.session.endAt - state.session.startAt) / (1000 * 60),
              1 / 60,
            );
            const solved = Math.max(state.totalSolved - state.session.startSolved, 0);
            next = {
              ...next,
              session: {
                active: false,
                durationMinutes: 0,
                startAt: 0,
                endAt: 0,
                startSolved: 0,
              },
              lastSessionSummary: {
                solved,
                elapsedMinutes: Math.round(elapsedMinutes),
                speed: Math.round(solved / (elapsedMinutes / 60)),
                endedAt: now,
              },
            };
          }
          return next;
        }),
      addStudyMinute: () => {
        set((state) => {
          const today = getTodayKey();
          const sameDay = state.studyMinutesDate === today;
          return {
            studyMinutes: state.studyMinutes + 1,
            studyMinutesToday: sameDay ? state.studyMinutesToday + 1 : 1,
            studyMinutesDate: today,
          };
        });
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("neet:study-minute"));
        }
      },
      clearAll: () => set({ ...initialState, preferences: get().preferences }),
      getSnapshot: () => {
        const s = get();
        const activityTotal = getActivityTotal(s.totalSolved, s.totalPagesRead, s.studyMinutes);
        const { rank } = getRank(activityTotal);
        return {
          xp: s.xp,
          level: s.level,
          totalSolved: s.totalSolved,
          totalPagesRead: s.totalPagesRead,
          activityTotal,
          streak: s.streak,
          bestStreak: s.bestStreak,
          rankLabel: rank.label,
          studyMinutes: s.studyMinutes,
        };
      },
    }),
    {
      name: "neet-mcq-tracker-pro-v2",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted, version) => {
        if (version >= 2 && persisted) {
          // Patch for YouTube background if missing or empty
          const p = persisted.preferences || {};
          if (!p.youtubeVideoUrl) {
            p.youtubeVideoUrl = DEFAULT_PREFERENCES.youtubeVideoUrl;
            p.bgVideoEnabled = true;
          }
          return persisted;
        }
        const v1 = loadV1State();
        const base = { ...initialState, ...(persisted || {}), ...(v1 || {}) };
        return {
          ...base,
          totalPagesRead: base.totalPagesRead ?? 0,
          dailyPageLogs: base.dailyPageLogs ?? {},
          dailyPageGoal: base.dailyPageGoal ?? 20,
          pageGoalCompletedToday: base.pageGoalCompletedToday ?? false,
          trackingMode: base.trackingMode ?? "mcq",
          pageTimestamps: base.pageTimestamps ?? [],
          lastPageAt: base.lastPageAt ?? 0,
          seenMilestones: base.seenMilestones ?? [],
          studyMinutes: base.studyMinutes ?? 0,
          studyMinutesToday: base.studyMinutesToday ?? 0,
          studyMinutesDate: base.studyMinutesDate ?? "",
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...(base.preferences || {}),
          },
        };
      },
      partialize: (state) => ({
        totalSolved: state.totalSolved,
        totalPagesRead: state.totalPagesRead,
        dailyLogs: state.dailyLogs,
        dailyPageLogs: state.dailyPageLogs,
        streak: state.streak,
        bestStreak: state.bestStreak,
        lastActiveDate: state.lastActiveDate,
        xp: state.xp,
        level: state.level,
        dailyGoal: state.dailyGoal,
        dailyPageGoal: state.dailyPageGoal,
        goalCompletedToday: state.goalCompletedToday,
        pageGoalCompletedToday: state.pageGoalCompletedToday,
        trackingMode: state.trackingMode,
        mcqTimestamps: state.mcqTimestamps,
        pageTimestamps: state.pageTimestamps,
        momentumChain: state.momentumChain,
        bestMomentumChain: state.bestMomentumChain,
        lastMcqAt: state.lastMcqAt,
        lastPageAt: state.lastPageAt,
        breakWarning: state.breakWarning,
        velocityTarget: state.velocityTarget,
        seenMilestones: state.seenMilestones,
        studyMinutes: state.studyMinutes,
        studyMinutesToday: state.studyMinutesToday,
        studyMinutesDate: state.studyMinutesDate,
        preferences: state.preferences,
        minimizedWidgets: state.minimizedWidgets,
        session: state.session,
        lastSessionSummary: state.lastSessionSummary,
      }),
    },
  ),
);
