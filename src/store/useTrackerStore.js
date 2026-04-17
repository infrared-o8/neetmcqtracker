import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { dayDiff, getLevelFromXp, getTodayKey } from "../utils/gamification";

const initialState = {
  totalSolved: 0,
  dailyLogs: {},
  streak: 0,
  bestStreak: 0,
  lastActiveDate: "",
  xp: 0,
  level: 1,
  dailyGoal: 120,
  goalCompletedToday: false,
  mcqTimestamps: [],
  momentumChain: 0,
  bestMomentumChain: 0,
  lastMcqAt: 0,
  breakWarning: false,
  velocityTarget: 60,
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
    };
  }

  const hadActivity = (state.dailyLogs[state.lastActiveDate] ?? 0) > 0;
  return {
    ...state,
    streak: hadActivity ? state.streak : 0,
    lastActiveDate: today,
    goalCompletedToday: false,
  };
}

export const useTrackerStore = create(
  persist(
    (set) => ({
      ...initialState,
      ensureToday: () => {
        set((current) => applyRollover(current));
      },
      addMcq: () => {
        const today = getTodayKey();
        set((current) => {
          const now = Date.now();
          const state = applyRollover(current);
          const prevToday = state.dailyLogs[today] ?? 0;
          const nextToday = prevToday + 1;
          const nextLogs = { ...state.dailyLogs, [today]: nextToday };
          const hasStartedToday = prevToday === 0;
          const nextStreak = hasStartedToday ? state.streak + 1 : state.streak;
          const nextBestStreak = Math.max(state.bestStreak, nextStreak);
          const nextXp = state.xp + 1;
          const levelState = getLevelFromXp(nextXp);

          const freshTimestamps = [...state.mcqTimestamps, now].slice(-SPEED_WINDOW_SIZE);
          const continuingMomentum = state.lastMcqAt > 0 && now - state.lastMcqAt <= BREAK_MS;
          const nextMomentum = continuingMomentum ? state.momentumChain + 1 : 1;

          return {
            ...state,
            dailyLogs: nextLogs,
            totalSolved: state.totalSolved + 1,
            xp: nextXp,
            level: levelState.level,
            streak: nextStreak,
            bestStreak: nextBestStreak,
            lastActiveDate: today,
            lastMcqAt: now,
            breakWarning: false,
            mcqTimestamps: freshTimestamps,
            momentumChain: nextMomentum,
            bestMomentumChain: Math.max(state.bestMomentumChain, nextMomentum),
            goalCompletedToday:
              state.goalCompletedToday || (state.dailyGoal > 0 && nextToday >= state.dailyGoal),
          };
        });
      },
      setDailyGoal: (goal) =>
        set((state) => {
          const today = getTodayKey();
          const todaySolved = state.dailyLogs[today] ?? 0;
          return {
            dailyGoal: goal,
            goalCompletedToday: goal > 0 && todaySolved >= goal,
          };
        }),
      setVelocityTarget: (target) =>
        set(() => ({
          velocityTarget: target,
        })),
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
          if (!state.session.active) {
            return state;
          }
          const now = Date.now();
          const elapsedMinutes = Math.max((now - state.session.startAt) / (1000 * 60), 1 / 60);
          const solved = Math.max(state.totalSolved - state.session.startSolved, 0);
          const speed = Math.round(solved / (elapsedMinutes / 60));
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
              speed,
              endedAt: now,
            },
          };
        }),
      checkInactivity: () =>
        set((state) => {
          const now = Date.now();
          const shouldWarn = state.lastMcqAt > 0 && now - state.lastMcqAt >= BREAK_MS;
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
      clearAll: () => set(initialState),
    }),
    {
      name: "neet-mcq-tracker-pro-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        totalSolved: state.totalSolved,
        dailyLogs: state.dailyLogs,
        streak: state.streak,
        bestStreak: state.bestStreak,
        lastActiveDate: state.lastActiveDate,
        xp: state.xp,
        level: state.level,
        dailyGoal: state.dailyGoal,
        goalCompletedToday: state.goalCompletedToday,
        mcqTimestamps: state.mcqTimestamps,
        momentumChain: state.momentumChain,
        bestMomentumChain: state.bestMomentumChain,
        lastMcqAt: state.lastMcqAt,
        breakWarning: state.breakWarning,
        velocityTarget: state.velocityTarget,
        session: state.session,
        lastSessionSummary: state.lastSessionSummary,
      }),
    },
  ),
);
