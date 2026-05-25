import { useMemo, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Confetti from "react-confetti";
import * as RGL from "react-grid-layout/legacy";
const { Responsive, WidthProvider } = RGL;
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { LayoutDashboard, RefreshCcw } from "lucide-react";

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
import { useTrackerStore } from "../store/useTrackerStore";
import { useProfileStore } from "../store/useProfileStore";
import { useMicroRewards } from "../hooks/useMicroRewards";
import { useLeaderboardSync } from "../hooks/useLeaderboardSync";
import { useMilestones } from "../hooks/useMilestones";
import {
  getActivityTotal,
  getLevelFromXp,
  getMotivationMessage,
  getRankProgress,
  getRollingMcqSpeed,
  getTodayKey,
} from "../utils/gamification";

import { FocusEngine } from "../components/FocusEngine";
import { checkDropEligibility } from "../utils/lootEngine";

const MotionDiv = motion.div;
const ResponsiveGridLayout = WidthProvider(Responsive);

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

const DEFAULT_LAYOUTS = {
  lg: [
    { i: "focus", x: 0, y: 0, w: 12, h: 8, static: false },
    { i: "today", x: 0, y: 8, w: 8, h: 6 },
    { i: "total", x: 8, y: 8, w: 4, h: 3 },
    { i: "streak", x: 8, y: 11, w: 4, h: 3 },
    { i: "rank", x: 0, y: 14, w: 4, h: 6 },
    { i: "quick", x: 4, y: 14, w: 8, h: 3 },
    { i: "goal", x: 4, y: 17, w: 4, h: 3 },
    { i: "speed", x: 8, y: 17, w: 4, h: 3 },
    { i: "camera", x: 0, y: 20, w: 8, h: 10 },
    { i: "heatmap", x: 8, y: 20, w: 4, h: 10 },
    { i: "ladder", x: 0, y: 30, w: 12, h: 6 },
    { i: "chart", x: 0, y: 36, w: 12, h: 8 },
  ],
};

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
  const velocityTarget = useTrackerStore((s) => s.velocityTarget);
  const setVelocityTarget = useTrackerStore((s) => s.setVelocityTarget);
  const preferences = useTrackerStore((s) => s.preferences);
  const setPreferences = useTrackerStore((s) => s.setPreferences);
  const minimizedWidgets = useTrackerStore((s) => s.minimizedWidgets);
  const toggleMinimized = useTrackerStore((s) => s.toggleMinimized);
  const dashboardLayout = useTrackerStore((s) => s.dashboardLayout);
  const setDashboardLayout = useTrackerStore((s) => s.setDashboardLayout);
  const resetDashboardLayout = useTrackerStore((s) => s.resetDashboardLayout);

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
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

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

  const onLayoutChange = (currentLayout, allLayouts) => {
    // Only save if it's not a temporary change during minimization
    setDashboardLayout(allLayouts);
  };

  const handleToggleMinimize = (id) => {
    toggleMinimized(id);
    
    // Update layout height when minimizing/maximizing
    if (dashboardLayout) {
      const newLayouts = { ...dashboardLayout };
      Object.keys(newLayouts).forEach((breakpoint) => {
        newLayouts[breakpoint] = newLayouts[breakpoint].map((item) => {
          if (item.i === id) {
            const isNowMinimized = !minimizedWidgets.includes(id);
            return {
              ...item,
              h: isNowMinimized ? 1 : DEFAULT_LAYOUTS.lg.find(d => d.i === id)?.h || 4,
            };
          }
          return item;
        });
      });
      setDashboardLayout(newLayouts);
    }
  };

  return (
    <div className="relative px-5 pb-24 pt-6">
      <AnimatePresence>
        {pendingCrates.length > deferredCratesCount && (
          <CaseUnlockView 
            crateType={pendingCrates[deferredCratesCount]} 
            onDismiss={() => {
              removeFirstPendingCrate();
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

      <FaceStudyTopBar />

      <MotionDiv initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <LayoutDashboard className="h-5 w-5 text-cyan-400" />
            </div>
            <input
              type="text"
              value={preferences.currentWork}
              onChange={(e) => setPreferences({ currentWork: e.target.value })}
              placeholder="What are you working on? (e.g., Organic Chemistry - NCERT)"
              className="flex-1 rounded-xl border border-white/10 bg-zinc-900/60 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-cyan-400/40 focus:ring-1 focus:ring-cyan-400/20"
            />
          </div>
          <button
            onClick={resetDashboardLayout}
            className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset Layout
          </button>
        </div>

        <ResponsiveGridLayout
          className="layout"
          layouts={dashboardLayout || DEFAULT_LAYOUTS}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={30}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          margin={[16, 16]}
        >
          <div key="focus" className="overflow-hidden">
            <div className="drag-handle absolute top-2 right-12 z-20 cursor-move p-2 text-white/20 hover:text-white/60">
              :::
            </div>
            <FocusEngine />
          </div>

          <div key="today">
            <StatGlowCard
              outline="cyan"
              rankPulse={rankPulse}
              goalGlow={goalMet}
              perf={true}
              className="group h-full"
              id="today"
              minimized={isMinimized("today")}
              onToggleMinimize={handleToggleMinimize}
              title={isPages ? "Today · Pages" : "Today · MCQs"}
            >
              <div className="drag-handle cursor-move">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 transition-colors group-hover:text-cyan-200/90">
                  Today · {isPages ? "Pages" : "MCQs"}
                </p>
                <p className="mt-2 text-5xl font-semibold text-white">
                  <RollingNumber value={todayCount} />
                </p>
                {isCombo && (
                  <span className="combo-badge mt-2 inline-block">Combo ×{Math.min(momentumChain, 99)}</span>
                )}
              </div>
            </StatGlowCard>
          </div>

          <div key="total">
            <StatGlowCard 
              outline="violet" 
              rankPulse={rankPulse} 
              perf={true} 
              className="group h-full"
              id="total"
              minimized={isMinimized("total")}
              onToggleMinimize={handleToggleMinimize}
              title="Activity total"
            >
              <div className="drag-handle cursor-move">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400 transition-colors group-hover:text-violet-200/90">
                  Activity total
                </p>
                <p className="mt-2 text-3xl font-semibold text-white">
                  <RollingNumber value={activityTotal} />
                </p>
                <p className="mt-1 text-xs text-zinc-500 truncate">
                  {totalSolved} MCQs · {totalPagesRead} pages
                </p>
              </div>
            </StatGlowCard>
          </div>

          <div key="streak">
            <GlowCard 
              id="streak"
              className="group h-full"
              minimized={isMinimized("streak")}
              onToggleMinimize={handleToggleMinimize}
              title="Streak"
              perf={true}
            >
              <div className="drag-handle cursor-move">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Streak</p>
                <p className="mt-2 text-4xl font-semibold text-orange-300">
                  <RollingNumber value={streak} />d
                </p>
                <p className="text-xs text-zinc-500">Best: {bestStreak}d</p>
              </div>
            </GlowCard>
          </div>

          <div key="rank">
            <GlowCard
              id="rank"
              minimized={isMinimized("rank")}
              onToggleMinimize={handleToggleMinimize}
              title="Rank"
              className={`group h-full transition-all duration-500 ${
                rankPulse ? "rank-card-spectacle glow-border animate-glow-pulse" : ""
              }`}
            >
              <div className="drag-handle cursor-move">
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
              </div>
            </GlowCard>
          </div>

          <div key="quick">
            <GlowCard 
              glow={goalMet} 
              id="quick"
              minimized={isMinimized("quick")}
              onToggleMinimize={handleToggleMinimize}
              title="Quick add"
              className="group h-full"
            >
              <div className="drag-handle cursor-move mb-2">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Quick add</p>
              </div>
              <QuickAddControls
                onAdd={handleAdd}
                label={isPages ? "Page" : "MCQ"}
                showCombo={isCombo}
                comboCount={momentumChain}
              />
            </GlowCard>
          </div>

          <div key="goal">
            <GlowCard 
              glow={goalMet} 
              id="goal"
              minimized={isMinimized("goal")}
              onToggleMinimize={handleToggleMinimize}
              title="Daily goal"
              className="group h-full"
            >
              <div className="drag-handle cursor-move mb-2">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Daily goal</p>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <GoalRing value={todayCount} max={dailyTarget} />
                <div className="flex-1">
                  <input
                    type="number"
                    min={1}
                    value={isPages ? dailyPageGoal : dailyGoal}
                    onChange={(e) =>
                      isPages
                        ? setDailyPageGoal(Number(e.target.value || 0))
                        : setDailyGoal(Number(e.target.value || 0))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900/70 px-3 py-2 text-white text-xs"
                  />
                </div>
              </div>
            </GlowCard>
          </div>

          <div key="speed">
            <div className="drag-handle h-full">
              <SpeedCard
                currentSpeed={currentSpeed}
                speedLabel={speedLabel}
                velocityTarget={velocityTarget}
                setVelocityTarget={setVelocityTarget}
                bestMomentumChain={bestMomentumChain}
                id="speed"
                className="group h-full"
                minimized={isMinimized("speed")}
                onToggleMinimize={handleToggleMinimize}
              />
            </div>
          </div>

          <div key="camera">
            <div className="drag-handle h-full">
              <StudyCameraCard 
                id="camera"
                minimized={isMinimized("camera")}
                onToggleMinimize={handleToggleMinimize}
              />
            </div>
          </div>

          <div key="heatmap">
            <GlowCard 
              id="heatmap"
              minimized={isMinimized("heatmap")}
              onToggleMinimize={handleToggleMinimize}
              title="Study density"
              className="group h-full overflow-hidden"
            >
              <div className="drag-handle cursor-move mb-2">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Study density</p>
              </div>
              <div className="scale-90 origin-top-left">
                <ContributionGrid dailyLogs={dailyLogs} dailyPageLogs={dailyPageLogs} weeks={26} />
              </div>
            </GlowCard>
          </div>

          <div key="ladder">
            <GlowCard
              id="ladder"
              minimized={isMinimized("ladder")}
              onToggleMinimize={handleToggleMinimize}
              title="Rank ladder"
              className="group h-full"
            >
              <div className="drag-handle cursor-move mb-2">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">Rank ladder</p>
              </div>
              <RankLadder activityTotal={activityTotal} />
            </GlowCard>
          </div>

          <div key="chart">
            <GlowCard 
              id="chart"
              minimized={isMinimized("chart")}
              onToggleMinimize={handleToggleMinimize}
              title="14-day history"
              className="group h-full"
            >
              <div className="drag-handle cursor-move mb-2">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">14-day history</p>
              </div>
              <div className="h-[200px]">
                <HistoryChart data={history} />
              </div>
            </GlowCard>
          </div>
        </ResponsiveGridLayout>
      </MotionDiv>
    </div>
  );
}
