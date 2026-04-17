import { useMemo, useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "react-confetti";
import { GoalRing } from "../components/GoalRing";
import { HistoryChart } from "../components/HistoryChart";
import { QuickAddButton } from "../components/QuickAddButton";
import { useSpacebarAdd } from "../hooks/useSpacebarAdd";
import { useTrackerStore } from "../store/useTrackerStore";
import {
  getLevelFromXp,
  getMotivationMessage,
  getRankProgress,
  getRollingMcqSpeed,
  getTodayKey,
} from "../utils/gamification";

const card = "rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_65px_rgba(8,8,12,0.45)] backdrop-blur-xl";
const MotionDiv = motion.div;

function buildHistory(dailyLogs, days = 14) {
  const today = new Date();
  return Array.from({ length: days }, (_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - idx - 1));
    const key = d.toISOString().slice(0, 10);
    return { label: key.slice(5), value: dailyLogs[key] ?? 0 };
  });
}

export function Dashboard() {
  const totalSolved = useTrackerStore((s) => s.totalSolved);
  const dailyLogs = useTrackerStore((s) => s.dailyLogs);
  const streak = useTrackerStore((s) => s.streak);
  const bestStreak = useTrackerStore((s) => s.bestStreak);
  const xp = useTrackerStore((s) => s.xp);
  const dailyGoal = useTrackerStore((s) => s.dailyGoal);
  const goalCompletedToday = useTrackerStore((s) => s.goalCompletedToday);
  const ensureToday = useTrackerStore((s) => s.ensureToday);
  const addStoredMcq = useTrackerStore((s) => s.addMcq);
  const setDailyGoal = useTrackerStore((s) => s.setDailyGoal);
  const clearAll = useTrackerStore((s) => s.clearAll);
  const mcqTimestamps = useTrackerStore((s) => s.mcqTimestamps);
  const momentumChain = useTrackerStore((s) => s.momentumChain);
  const bestMomentumChain = useTrackerStore((s) => s.bestMomentumChain);
  const breakWarning = useTrackerStore((s) => s.breakWarning);
  const velocityTarget = useTrackerStore((s) => s.velocityTarget);
  const setVelocityTarget = useTrackerStore((s) => s.setVelocityTarget);
  const session = useTrackerStore((s) => s.session);
  const lastSessionSummary = useTrackerStore((s) => s.lastSessionSummary);
  const startSession = useTrackerStore((s) => s.startSession);
  const endSession = useTrackerStore((s) => s.endSession);
  const checkInactivity = useTrackerStore((s) => s.checkInactivity);
  const [burst, setBurst] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 760 });
  const [clockTick, setClockTick] = useState(() => Date.now());
  const today = getTodayKey();
  const todaySolved = dailyLogs[today] ?? 0;
  const levelData = getLevelFromXp(xp);
  const rankProgress = getRankProgress(totalSolved);
  const motivation = getMotivationMessage({
    todaySolved,
    streak,
    totalSolved,
    dailyGoal,
  });
  const currentSpeed = getRollingMcqSpeed(mcqTimestamps);
  const speedStatus =
    currentSpeed < 20 ? "slow" : currentSpeed < 50 ? "medium" : "fast";
  const velocityDeltaPercent =
    velocityTarget > 0 ? Math.round(((currentSpeed - velocityTarget) / velocityTarget) * 100) : 0;
  const isHeatMode = currentSpeed >= Math.max(velocityTarget, 50) && momentumChain >= 10;
  const isSlowdown = currentSpeed > 0 && currentSpeed < velocityTarget * 0.88;
  const sessionSolved = session.active ? Math.max(totalSolved - session.startSolved, 0) : 0;
  const sessionMinutesLeft = session.active
    ? Math.max(Math.ceil((session.endAt - clockTick) / (1000 * 60)), 0)
    : 0;

  useEffect(() => {
    ensureToday();
  }, [ensureToday]);

  useEffect(() => {
    const onResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockTick(Date.now());
      checkInactivity();
    }, 1000);
    return () => window.clearInterval(id);
  }, [checkInactivity]);

  const addMcq = () => {
    addStoredMcq();
    setBurst((v) => v + 1);
  };
  useSpacebarAdd(addMcq);

  const history = useMemo(() => buildHistory(dailyLogs, 14), [dailyLogs]);

  return (
    <div
      className={`relative mx-auto w-full max-w-6xl px-5 pb-10 pt-6 transition-all duration-300 ${
        breakWarning ? "brightness-75 saturate-75" : ""
      } ${isHeatMode ? "drop-shadow-[0_0_25px_rgba(34,211,238,0.35)] saturate-125" : ""}`}
    >
      <AnimatePresence>
        {goalCompletedToday && (
          <Confetti
            key={burst}
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={180}
            gravity={0.18}
          />
        )}
      </AnimatePresence>

      <MotionDiv initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.34 }}>
        {breakWarning && (
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, x: [0, -4, 4, -3, 0] }}
            className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/12 px-4 py-3 text-sm font-medium text-rose-200"
          >
            Momentum dying... Resume now to keep the chain alive.
          </MotionDiv>
        )}
        {isHeatMode && (
          <p className="mb-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/12 px-4 py-3 text-sm font-semibold text-cyan-100">
            You're in flow state. Heat mode active.
          </p>
        )}
        {isSlowdown && (
          <p className="mb-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            You're slowing down. Push the next 5 MCQs with urgency.
          </p>
        )}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className={`${card} md:col-span-1`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Today</p>
            <p className="mt-2 text-4xl font-semibold text-white">{todaySolved}</p>
          </div>
          <div className={`${card} md:col-span-1`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Total MCQs</p>
            <p className="mt-2 text-4xl font-semibold text-white">{totalSolved}</p>
          </div>
          <div className={`${card} md:col-span-1`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Streak</p>
            <p className="mt-2 text-4xl font-semibold text-white">{streak}d</p>
            <p className="text-xs text-zinc-500">Best: {bestStreak}d</p>
          </div>
          <div className={`${card} md:col-span-1`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Rank</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{rankProgress.currentRank.label}</p>
          </div>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className={`${card} md:col-span-1`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Current speed</p>
            <p className="mt-1 text-3xl font-bold text-white">{currentSpeed} MCQs/hr</p>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-1/3 bg-rose-500/80" />
              <div className="h-full w-1/3 bg-amber-400/80" />
              <div className="h-full w-1/3 bg-emerald-400/80" />
            </div>
            <p className="mt-2 text-xs text-zinc-300">
              Zone: {speedStatus === "slow" ? "Slow" : speedStatus === "medium" ? "Medium" : "Fast"}
            </p>
          </div>
          <div className={`${card} md:col-span-1`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Momentum chain</p>
            <p className="mt-1 text-3xl font-bold text-orange-300">{momentumChain} 🔥</p>
            <p className="mt-2 text-xs text-zinc-400">Best today: {bestMomentumChain}</p>
          </div>
          <div className={`${card} md:col-span-1`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Velocity target</p>
            <input
              type="number"
              min={10}
              value={velocityTarget}
              onChange={(e) => setVelocityTarget(Number(e.target.value || 0))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-base font-semibold text-white outline-none ring-fuchsia-400/40 focus:ring-2"
            />
            <p className={`mt-2 text-xs ${velocityDeltaPercent >= 0 ? "text-emerald-300" : "text-amber-300"}`}>
              {velocityDeltaPercent >= 0 ? `+${velocityDeltaPercent}% above target` : `${velocityDeltaPercent}% below target`}
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
          <section className={`${card} relative overflow-hidden`}>
            <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Quick add</p>
            <QuickAddButton onAdd={addMcq} />
            {totalSolved === 0 && (
              <p className="mt-10 text-center text-sm text-zinc-400">
                Start your first session. One click, one MCQ, one step closer.
              </p>
            )}
            <div className="mt-9 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Level {levelData.level}</p>
                <p className="text-xs text-zinc-300">
                  {levelData.xpIntoLevel}/{levelData.xpForNextLevel} XP
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <MotionDiv
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(levelData.xpIntoLevel / Math.max(levelData.xpForNextLevel, 1)) * 100}%`,
                  }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Rank progress</p>
                <p className="text-xs text-zinc-300">
                  {rankProgress.nextRank
                    ? `${rankProgress.remainingToNext} to ${rankProgress.nextRank.label}`
                    : "Final rank achieved"}
                </p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <MotionDiv
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${rankProgress.progressPercent}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Active session mode</p>
              {!session.active ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {[25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => startSession(mins)}
                      className="rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
                    >
                      Start {mins}m
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <p className="text-sm text-zinc-200">Time left: {sessionMinutesLeft} min</p>
                  <p className="text-sm text-zinc-200">Session MCQs: {sessionSolved}</p>
                  <p className="text-sm text-zinc-200">Speed: {currentSpeed} MCQs/hr</p>
                  <button
                    type="button"
                    onClick={endSession}
                    className="mt-1 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  >
                    End session
                  </button>
                </div>
              )}
              {lastSessionSummary && (
                <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  You did {lastSessionSummary.solved} MCQs in {lastSessionSummary.elapsedMinutes} min. Speed:{" "}
                  {lastSessionSummary.speed} MCQs/hr.
                </div>
              )}
            </div>
          </section>

          <section className={`${card}`}>
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Daily goal</p>
            <div className="mt-4 flex items-center justify-between gap-5">
              <GoalRing value={todaySolved} max={dailyGoal} />
              <div className="flex-1">
                <label className="text-xs uppercase tracking-[0.22em] text-zinc-400">Target MCQs</label>
                <input
                  type="number"
                  min={1}
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(Number(e.target.value || 0))}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-900/70 px-4 py-2 text-lg font-semibold text-white outline-none ring-fuchsia-400/40 focus:ring-2"
                />
                <p className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                  {motivation}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Reset all progress? This cannot be undone.")) {
                      clearAll();
                    }
                  }}
                  className="mt-4 w-full rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                >
                  Reset progress
                </button>
              </div>
            </div>
          </section>
        </div>

        <section className={`${card} mt-4`}>
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-zinc-400">History (14 days)</p>
          <HistoryChart data={history} />
        </section>
      </MotionDiv>
    </div>
  );
}
