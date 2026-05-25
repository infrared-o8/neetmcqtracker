import { useMemo, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "react-confetti";
import { GoalRing } from "../components/GoalRing";
import { HistoryChart } from "../components/HistoryChart";
import { QuickAddControls } from "../components/QuickAddControls";
import { ContributionGrid } from "../components/ContributionGrid";
import { RankLadder } from "../components/RankLadder";
import { GlowCard } from "../components/ui/GlowCard";
import { StatGlowCard } from "../components/ui/StatGlowCard";
import { useRankUpgradePulse } from "../hooks/useRankUpgradePulse";
import { RollingNumber } from "../components/ui/RollingNumber";
import { MilestoneReveal } from "../components/MilestoneReveal";
import { RankUnlockSpectacle } from "../components/dashboard/RankUnlockSpectacle";
import { SpeedCard } from "../components/dashboard/SpeedCard";
import { FaceStudyTopBar } from "../components/study/FaceStudyTopBar";
import { StudyCameraCard } from "../components/study/StudyCameraCard";
import { LiveMarquee } from "../components/LiveMarquee";
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { useMicroRewards } from "../hooks/useMicroRewards";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { useMilestones } from "../hooks/useMilestones";
import {
  getActivityTotal,
  getStudyActivityBonus,
  getLevelFromXp,
  getMotivationMessage,
  getRankProgress,
  getRollingMcqSpeed,
  getTodayKey,
} from "../utils/gamification";

import { FocusEngine } from "../components/FocusEngine";
import { checkDropEligibility } from "../utils/lootEngine";

const MotionDiv = motion.div;

function buildHistory(dailyLogs, dailyPageLogs, days = 14) {
  const today = new Date();
  return Array.from({ length: days }, (_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - idx - 1));
    const key = d.toISOString().slice(0, 10);
    const mcq = dailyLogs[key] ?? 0;
    const pages = dailyPageLogs[key] ?? 0;
    return { label: key.slice(5), value: mcq + pages };
  });
}

export function BentoDashboard() {
  const totalSolved = useTrackerStore((s) => s.totalSolved);
  const totalPagesRead = useTrackerStore((s) => s.totalPagesRead);
  const dailyLogs = useTrackerStore((s) => s.dailyLogs);
  const dailyPageLogs = useTrackerStore((s) => s.dailyPageLogs);
  const streak = useTrackerStore((s) => s.streak);
  const bestStreak = useTrackerStore((s) => s.bestStreak);
  const xp = useTrackerStore((s) => s.xp);
  const dailyGoal = useTrackerStore((s) => s.dailyGoal);
  const dailyPageGoal = useTrackerStore((s) => s.dailyPageGoal);
  const goalCompletedToday = useTrackerStore((s) => s.goalCompletedToday);
  const pageGoalCompletedToday = useTrackerStore((s) => s.pageGoalCompletedToday);
  const trackingMode = useTrackerStore((s) => s.trackingMode);
  const ensureToday = useTrackerStore((s) => s.ensureToday);
  const addMcq = useTrackerStore((s) => s.addMcq);
  const addPages = useTrackerStore((s) => s.addPages);
  const setDailyGoal = useTrackerStore((s) => s.setDailyGoal);
  const setDailyPageGoal = useTrackerStore((s) => s.setDailyPageGoal);
  const clearAll = useTrackerStore((s) => s.clearAll);
  const mcqTimestamps = useTrackerStore((s) => s.mcqTimestamps);
  const pageTimestamps = useTrackerStore((s) => s.pageTimestamps);
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
  const preferences = useTrackerStore((s) => s.preferences);
  const setPreferences = useTrackerStore((s) => s.setPreferences);
  const minimizedWidgets = useTrackerStore((s) => s.minimizedWidgets);
  const toggleMinimized = useTrackerStore((s) => s.toggleMinimized);

  const { onIncrement, playLevelUp } = useMicroRewards();
  const { scheduleSync } = useLeaderboardSync();
  const { activeMilestone, dismissMilestone } = useMilestones();
  const studyMinutes = useTrackerStore((s) => s.studyMinutes);
  const studyMinutesToday = useTrackerStore((s) => s.studyMinutesToday);
  const { pulsing: rankPulse, pulseKey: rankPulseKey, rankLabel: unlockedRankLabel, dismiss: dismissRankPulse } =
    useRankUpgradePulse();

  const activityTotal = getActivityTotal(totalSolved, totalPagesRead, studyMinutes);

  const [burst, setBurst] = useState(0);
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 760 });
  const [clockTick, setClockTick] = useState(() => Date.now());
  const [prevLevel, setPrevLevel] = useState(1);
  const pendingCrates = useProfileStore((s) => s.pendingCrates);
  const removeFirstPendingCrate = useProfileStore((s) => s.removeFirstPendingCrate);
  const addPendingCrate = useProfileStore((s) => s.addPendingCrate);
  const [prevAp, setPrevAp] = useState(activityTotal);
  const [deferredCratesCount, setDeferredCratesCount] = useState(0);

  const today = getTodayKey();
  const todaySolved = dailyLogs[today] ?? 0;
  const todayPages = dailyPageLogs[today] ?? 0;
  const levelData = getLevelFromXp(xp);
  const rankProgress = getRankProgress(activityTotal);
  const isPages = trackingMode === "pages";
  const todayCount = isPages ? todayPages : todaySolved;
  const dailyTarget = isPages ? dailyPageGoal : dailyGoal;
  const goalMet = isPages ? pageGoalCompletedToday : goalCompletedToday;
  const timestamps = isPages ? pageTimestamps : mcqTimestamps;
  const currentSpeed = getRollingMcqSpeed(timestamps);
  const speedLabel = isPages ? "pages/hr" : "MCQs/hr";
  const motivation = getMotivationMessage({
    todaySolved,
    todayPages,
    streak,
    activityTotal,
    dailyGoal,
    dailyPageGoal,
    trackingMode,
  });

  const isCombo = momentumChain >= 2;
  const sessionSolved = session.active ? Math.max(totalSolved - session.startSolved, 0) : 0;
  const sessionMinutesLeft = session.active
    ? Math.max(Math.ceil((session.endAt - clockTick) / (1000 * 60)), 0)
    : 0;

  useEffect(() => {
    ensureToday();
  }, [ensureToday]);

  useEffect(() => {
    if (levelData.level > prevLevel) {
      playLevelUp();
      setPrevLevel(levelData.level);
    }
  }, [levelData.level, prevLevel, playLevelUp]);

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

      // Kota Star Batch Crate Check: 3-hour continuous focus (180 mins)
      if (session.active && !session.crateAwarded) {
        const elapsedMins = (Date.now() - session.startAt) / (1000 * 60);
        if (elapsedMins >= 180) {
          setPendingCrate('STAR_BATCH');
          // Update store to prevent double-awarding in same session
          useTrackerStore.setState((s) => ({
            session: { ...s.session, crateAwarded: true }
          }));
        }
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [checkInactivity, session]);

  const handleAdd = useCallback(
    (amount = 1) => {
      if (isPages) addPages(amount);
      else addMcq(amount);
      onIncrement();
      scheduleSync();
      setBurst((v) => v + 1);
    },
    [isPages, addPages, addMcq, onIncrement, scheduleSync],
  );

  const history = useMemo(
    () => buildHistory(dailyLogs, dailyPageLogs, 14),
    [dailyLogs, dailyPageLogs],
  );

  const isMinimized = (id) => minimizedWidgets.includes(id);

  useEffect(() => {
    const drop = checkDropEligibility(prevAp, activityTotal, preferences.devModeEnabled);
    if (drop) {
      addPendingCrate(drop);
    }
    setPrevAp(activityTotal);
  }, [activityTotal, prevAp, preferences.devModeEnabled, addPendingCrate]);

  return (
    <div
      className={`relative px-5 pb-10 pt-6 transition-all duration-300 ${
        breakWarning ? "brightness-75 saturate-75" : ""
      }`}
    >
      <AnimatePresence>
        {pendingCrates.length > deferredCratesCount && (
          <CaseUnlockView 
            crateType={pendingCrates[deferredCratesCount]} 
            onDismiss={() => {
              removeFirstPendingCrate();
              // If we open a crate, we don't need to skip it anymore
            }} 
            onSave={() => setDeferredCratesCount(v => v + 1)}
          />
        )}
        {(goalMet || rankPulse) && (
          <Confetti
            key={`${burst}-${rankPulseKey}`}
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={preferences.reduceGpuUsage ? 50 : (rankPulse ? 280 : 180)}
            gravity={0.18}
          />
        )}
      </AnimatePresence>
      <RankUnlockSpectacle
        active={rankPulse}
        rankLabel={unlockedRankLabel}
        pulseKey={rankPulseKey}
        onDismiss={dismissRankPulse}
      />
      <MilestoneReveal milestone={activeMilestone} onDismiss={dismissMilestone} />

      <LiveMarquee />
      <FaceStudyTopBar />

      <MotionDiv initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-4 flex items-center gap-3">
          <input
            type="text"
            value={preferences.currentWork}
            onChange={(e) => setPreferences({ currentWork: e.target.value })}
            placeholder="What are you working on? (e.g., Organic Chemistry - NCERT)"
            className="flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
          />
        </div>

        {breakWarning && (
          <p className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/12 px-4 py-3 text-sm text-rose-200">
            Momentum dying... Resume within 10 min to keep the combo.
          </p>
        )}

        <div className="bento-grid">
          
          <StatGlowCard
            outline="cyan"
            rankPulse={rankPulse}
            goalGlow={goalMet}
            perf={true}
            className={`bento-today group ${isMinimized("today") ? "h-fit" : ""}`}
            id="today"
            minimized={isMinimized("today")}
            onToggleMinimize={toggleMinimized}
            title={isPages ? "Today · Pages" : "Today · MCQs"}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 transition-colors group-hover:text-cyan-200/90">
              Today · {isPages ? "Pages" : "MCQs"}
            </p>
            <p className="mt-2 text-5xl font-semibold text-white">
              <RollingNumber value={todayCount} />
            </p>
            {isCombo && (
              <span className="combo-badge mt-2 inline-block">Combo ×{Math.min(momentumChain, 99)}</span>
            )}
          </StatGlowCard>

          <StatGlowCard 
            outline="violet" 
            rankPulse={rankPulse} 
            perf={true} 
            className={`bento-total group ${isMinimized("total") ? "h-fit" : ""}`}
            id="total"
            minimized={isMinimized("total")}
            onToggleMinimize={toggleMinimized}
            title="Activity total"
          >
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 transition-colors group-hover:text-violet-200/90">
              Activity total
            </p>
            <p className="mt-2 text-3xl font-semibold text-white">
              <RollingNumber value={activityTotal} />
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {totalSolved} MCQs · {totalPagesRead} pages · {studyMinutes}m study (
              +{getStudyActivityBonus(studyMinutes)} activity)
            </p>
          </StatGlowCard>

          <GlowCard 
            id="streak"
            className={`bento-streak group ${isMinimized("streak") ? "h-fit" : ""}`}
            minimized={isMinimized("streak")}
            onToggleMinimize={toggleMinimized}
            title="Streak"
            perf={true}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Streak</p>
            <p className="mt-2 text-4xl font-semibold text-orange-300">
              <RollingNumber value={streak} />d
            </p>
            <p className="text-xs text-zinc-500">Best: {bestStreak}d</p>
            <p className="mt-3 border-t border-white/5 pt-2 text-xs text-zinc-500">
              Study: <span className="font-semibold text-emerald-300">{studyMinutesToday}m</span> today ·{" "}
              <span className="text-zinc-400">{studyMinutes}m</span> total
            </p>
          </GlowCard>

          <GlowCard
            id="rank"
            minimized={isMinimized("rank")}
            onToggleMinimize={toggleMinimized}
            title="Rank"
            className={`bento-rank group transition-all duration-500 ${
              rankPulse ? "rank-card-spectacle glow-border animate-glow-pulse" : ""
            } ${isMinimized("rank") ? "h-fit" : ""}`}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Rank</p>
            <motion.p
              key={rankProgress.currentRank.label}
              className="mt-2 text-xl font-semibold chroma-text"
              animate={rankPulse ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 0.6, repeat: rankPulse ? Infinity : 0, repeatDelay: 0.3 }}
            >
              {rankProgress.currentRank.label}
            </motion.p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-800">
              <MotionDiv
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-400"
                animate={{ width: `${rankProgress.progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {rankProgress.nextRank
                ? `${rankProgress.remainingToNext} to ${rankProgress.nextRank.label}`
                : "Max rank"}
            </p>
            <div className="mt-4">
              <p className="text-xs text-zinc-500">Level {levelData.level}</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-400"
                  style={{
                    width: `${(levelData.xpIntoLevel / Math.max(levelData.xpForNextLevel, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </GlowCard>

          <GlowCard 
            glow={goalMet} 
            id="quick"
            minimized={isMinimized("quick")}
            onToggleMinimize={toggleMinimized}
            title="Quick add"
            className={`bento-quick group ${isMinimized("quick") ? "h-fit" : ""}`}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Quick add</p>
            <QuickAddControls
              onAdd={handleAdd}
              label={isPages ? "Page" : "MCQ"}
              showCombo={isCombo}
              comboCount={momentumChain}
            />
          </GlowCard>

          <GlowCard 
            glow={goalMet} 
            id="goal"
            minimized={isMinimized("goal")}
            onToggleMinimize={toggleMinimized}
            title="Daily goal"
            className={`bento-goal group ${isMinimized("goal") ? "h-fit" : ""}`}
          >
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Daily goal</p>
            <div className="mt-3 flex items-center gap-4">
              <GoalRing value={todayCount} max={dailyTarget} />
              <div className="flex-1">
                <label className="text-xs text-zinc-500">
                  Target {isPages ? "pages" : "MCQs"}
                </label>
                <input
                  type="number"
                  min={1}
                  value={isPages ? dailyPageGoal : dailyGoal}
                  onChange={(e) =>
                    isPages
                      ? setDailyPageGoal(Number(e.target.value || 0))
                      : setDailyGoal(Number(e.target.value || 0))
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-white"
                />
              </div>
            </div>
            <p className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              {motivation}
            </p>
          </GlowCard>

          <SpeedCard
            currentSpeed={currentSpeed}
            speedLabel={speedLabel}
            velocityTarget={velocityTarget}
            setVelocityTarget={setVelocityTarget}
            bestMomentumChain={bestMomentumChain}
            id="speed"
            className={`bento-speed group ${isMinimized("speed") ? "h-fit" : ""}`}
            minimized={isMinimized("speed")}
            onToggleMinimize={toggleMinimized}
          />

          <StudyCameraCard 
            id="camera"
            minimized={isMinimized("camera")}
            onToggleMinimize={toggleMinimized}
          />

          <GlowCard 
            id="heatmap"
            minimized={isMinimized("heatmap")}
            onToggleMinimize={toggleMinimized}
            title="Study density"
            className={`bento-heatmap group ${isMinimized("heatmap") ? "h-fit" : ""}`}
          >
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-400">Study density</p>
            <ContributionGrid dailyLogs={dailyLogs} dailyPageLogs={dailyPageLogs} weeks={26} />
          </GlowCard>

          <div className={`bento-ladder ${isMinimized("ladder") ? "h-fit" : ""}`}>
            <GlowCard
              id="ladder"
              minimized={isMinimized("ladder")}
              onToggleMinimize={toggleMinimized}
              title="Rank ladder"
              className="group"
            >
              <RankLadder activityTotal={activityTotal} />
            </GlowCard>
          </div>

          <div className={`bento-session ${isMinimized("session") ? "h-fit" : ""}`}>
            <FocusEngine />
          </div>

          <GlowCard 
            id="chart"
            minimized={isMinimized("chart")}
            onToggleMinimize={toggleMinimized}
            title="14-day history"
            className={`bento-chart group ${isMinimized("chart") ? "h-fit" : ""}`}
          >
            <p className="mb-3 text-xs uppercase tracking-[0.22em] text-zinc-400">14-day history</p>
            <HistoryChart data={history} />
          </GlowCard>
        </div>
      </MotionDiv>
    </div>
  );
}
