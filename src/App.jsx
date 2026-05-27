import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ClerkProvider, useClerk } from "@clerk/clerk-react";
import { useAuth } from "./hooks/useAuthShim";
import { StudySidebar } from "./components/StudySidebar";
import { YoutubeMedia } from "./components/YoutubeMedia";
import { ThemeBackground } from "./components/ThemeBackground";
import { ParticleEngine } from "./components/ParticleEngine";
import { Dashboard } from "./pages/Dashboard";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import StudyRoomPage from "./pages/StudyRoomPage";
import NeetDatabase from "./pages/NeetDatabase";
import LogbookPage from "./pages/LogbookPage";
import { QuickInsertPalette } from "./components/QuickInsertPalette";
import { useProfileStore } from "./store/useProfileStore";
import { useTrackerStore } from "./store/useTrackerStore";
import { useLogbookStore } from "./store/useLogbookStore";
import { FaceStudyProvider } from "./context/FaceStudyProvider";
import { useFaceStudyContext } from "./hooks/useFaceStudyContext";
import { useThock } from "./hooks/useThock";
import { FRAMES } from "./data/profileDecor";

import { FaceStudyTopBar } from "./components/study/FaceStudyTopBar";
import { useMicroRewards } from "./hooks/useMicroRewards";
import { MobileNav } from "./components/ui/MobileNav";
import { Camera, X, Check, Brain, UserCircle, ArrowRight, Loader2 } from "lucide-react";

const MotionDiv = motion.div;

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY. Auth features will be limited.");
}

/**
 * Onboarding for new users to set their display name.
 * Triggers if total progress is zero and name is default.
 */
function NewUserOnboarding() {
  const totalSolved = useTrackerStore(s => s.totalSolved);
  const totalPagesRead = useTrackerStore(s => s.totalPagesRead);
  const studyMinutes = useTrackerStore(s => s.studyMinutes);
  const displayName = useProfileStore(s => s.displayName);
  const setDisplayName = useProfileStore(s => s.setDisplayName);

  const [show, setShow] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Show if 0 stats and name is default/empty
    const isNew = totalSolved === 0 && totalPagesRead === 0 && studyMinutes === 0;
    // Use a small timeout to avoid the 'Cannot update while rendering' error
    const timer = setTimeout(() => {
      if (isNew && (!displayName || displayName === "Aspirant")) {
        setShow(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [totalSolved, totalPagesRead, studyMinutes, displayName]);
  const handleSave = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setLoading(true);
    // Artificial delay for feel
    await new Promise(r => setTimeout(r, 600));
    setDisplayName(nameInput.trim());
    setShow(false);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-zinc-900 p-10 shadow-2xl text-center"
          >
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-fuchsia-500/10 border border-fuchsia-500/20">
              <UserCircle className="h-10 w-10 text-fuchsia-400" />
            </div>
            
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Initialize Identity</h2>
            <p className="mt-2 text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
              Welcome Aspirant. Choose a unique codename for the leaderboard and live study rooms.
            </p>

            <form onSubmit={handleSave} className="mt-10 space-y-4">
              <div className="relative">
                <input 
                  autoFocus
                  required
                  maxLength={15}
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  placeholder="Enter Codename..."
                  className="w-full rounded-2xl border border-white/5 bg-black/40 px-6 py-5 text-center text-lg font-bold text-white outline-none focus:border-fuchsia-500/50 transition-all"
                />
              </div>
              
              <button 
                disabled={loading || !nameInput.trim()}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-fuchsia-600 py-5 font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-fuchsia-500/20 transition-all hover:bg-fuchsia-500 disabled:opacity-40 disabled:grayscale"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                  <>
                    Confirm Identity <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-[10px] font-black uppercase tracking-widest text-zinc-700">
              You can change this anytime in settings
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Global Camera Persistence Manager
 * Triggers modal when leaving dashboard with camera active.
 * Renders bottom progress bar if persistence is 'keep'.
 */
function CameraPersistenceLayer() {
  const location = useLocation();
  const { active, stopCamera, navigationPersistence, setPersistence, progressPercent, faceDetected } = useFaceStudyContext();
  const [showPrompt, setShowPrompt] = useState(false);
  const [wasOnDashboard, setWasOnDashboard] = useState(location.pathname === "/");

  useEffect(() => {
    const isDashboard = location.pathname === "/";
    
    // Trigger prompt if leaving dashboard while camera is active
    if (wasOnDashboard && !isDashboard && active && navigationPersistence === 'pending') {
      setShowPrompt(true);
    }
    
    // Stop camera if user previously chose to stop and we're not on dashboard
    if (!isDashboard && active && navigationPersistence === 'stop') {
      stopCamera();
    }

    setWasOnDashboard(isDashboard);
  }, [location.pathname, active, navigationPersistence, stopCamera, wasOnDashboard]);

  const handleChoice = (choice) => {
    setPersistence(choice);
    setShowPrompt(false);
    if (choice === 'stop') {
      stopCamera();
    }
  };

  return (
    <>
      <AnimatePresence>
        {showPrompt && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-zinc-900 p-8 text-center shadow-2xl"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Camera className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">AI Focus Session</h2>
              <p className="mt-2 text-xs font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                You're leaving the dashboard. Keep your camera on to continue earning study minutes?
              </p>
              
              <div className="mt-8 flex flex-col gap-3">
                <button 
                  onClick={() => handleChoice('keep')}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-cyan-600 py-4 font-black uppercase tracking-widest text-white shadow-lg shadow-cyan-500/20 transition-all hover:bg-cyan-500"
                >
                  <Check className="h-4 w-4" /> Keep Tracking
                </button>
                <button 
                  onClick={() => handleChoice('stop')}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-white/5 py-4 font-black uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/10"
                >
                  <X className="h-4 w-4" /> Stop Camera
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Persistence Progress Bar */}
      {active && navigationPersistence === 'keep' && location.pathname !== "/" && (
        <motion.div 
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 z-[100] h-1.5 bg-black/40 backdrop-blur-md"
        >
          <div 
            className={`h-full transition-all duration-1000 ease-linear ${faceDetected ? 'bg-gradient-to-r from-cyan-500 to-emerald-500' : 'bg-zinc-700'}`}
            style={{ width: `${progressPercent}%` }}
          />
          <div className="absolute -top-6 right-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 border border-white/5 backdrop-blur-sm">
            <div className={`h-1.5 w-1.5 rounded-full ${faceDetected ? 'bg-emerald-500 animate-ping' : 'bg-zinc-600'}`} />
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
              {faceDetected ? 'AI Tracking Active' : 'Face Missing'}
            </span>
          </div>
        </motion.div>
      )}
    </>
  );
}

/** 
 * Listens for global unauthenticated events and prompts for login
 */
function AuthListener() {
  const { openSignIn } = useClerk();

  useEffect(() => {
    const handleUnauth = () => {
      console.warn("[Auth] Unauthenticated API call detected. Prompting for sign-in.");
      if (openSignIn) {
        openSignIn({
          appearance: {
            variables: { colorPrimary: "#ec4899" } // Pink-500
          }
        });
      }
    };

    window.addEventListener("neet:unauthenticated", handleUnauth);
    return () => window.removeEventListener("neet:unauthenticated", handleUnauth);
  }, [openSignIn]);

  return null;
}

/** 
 * Helper component to sync Clerk userId with our local store 
 */
function ClerkSync() {
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && userId) {
      // Direct set state to ensure immediate sync
      useProfileStore.setState({ playerId: userId });
    }
  }, [userId, isLoaded]);

  return null;
}

function App() {
  const ensurePlayerId = useProfileStore((s) => s.ensurePlayerId);
  const syncTags = useLogbookStore((s) => s.syncTags);
  const preferences = useTrackerStore((s) => s.preferences);
  const decor = useProfileStore((s) => s.decor);
  const playClick = useThock();
  const { unlock: unlockRewards } = useMicroRewards();

  useEffect(() => {
    ensurePlayerId();
    syncTags(); // Fix old local storage tags
  }, [ensurePlayerId, syncTags]);

  // Global click listener for snappy audio feedback and AudioContext activation
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Resume contexts on first gesture
      unlockRewards();

      // Find interactive elements for "thock" sound
      const target = e.target;
      const interactive = target.closest('button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], [role="button"], .cursor-pointer');
      
      if (interactive) {
        playClick();
      }
    };

    window.addEventListener("mousedown", handleGlobalClick, { capture: true });
    return () => window.removeEventListener("mousedown", handleGlobalClick, { capture: true });
  }, [playClick, unlockRewards]);

  const activeEffect = FRAMES[decor.frameId]?.name || 'NONE';

  const AppContent = (
    <BrowserRouter>
      <FaceStudyProvider>
        <main className={`relative flex min-h-screen flex-col overflow-x-hidden text-zinc-100 ${preferences.uiOptimized ? 'ui-optimized' : ''} ${preferences.disableAnimations ? 'no-animations' : ''} ${!preferences.enableGlassmorphism ? 'no-glass' : ''}`}>
          <YoutubeMedia />
          <ThemeBackground cozyPreset={preferences.cozyPreset} />
          <CameraPersistenceLayer />
          <NewUserOnboarding />
          <QuickInsertPalette />
          <MotionDiv
            className="relative z-10 flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.38 }}
          >
            <div className="flex min-h-screen flex-1 relative overflow-hidden">
              <div className="hidden md:flex h-full shrink-0">
                <StudySidebar />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0 scroll-smooth">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/leaderboard" element={<LeaderboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/study-room" element={<StudyRoomPage />} />
                  <Route path="/database" element={<NeetDatabase />} />
                  <Route path="/logbook" element={<LogbookPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </div>
              <MobileNav />
            </div>
          </MotionDiv>
        </main>
      </FaceStudyProvider>
    </BrowserRouter>
  );

  if (!CLERK_PUBLISHABLE_KEY) {
    return AppContent;
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ClerkSync />
      <AuthListener />
      {AppContent}
    </ClerkProvider>
  );
}

export default App;

