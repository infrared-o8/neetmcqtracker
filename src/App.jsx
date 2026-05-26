import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import { ClerkProvider } from "@clerk/clerk-react";
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
import { useProfileStore } from "./store/useProfileStore";
import { useTrackerStore } from "./store/useTrackerStore";
import { FaceStudyProvider } from "./context/FaceStudyProvider";
import { useThock } from "./hooks/useThock";
import { FRAMES } from "./data/profileDecor";

import { FaceStudyTopBar } from "./components/study/FaceStudyTopBar";
import { useMicroRewards } from "./hooks/useMicroRewards";
import { MobileNav } from "./components/ui/MobileNav";

const MotionDiv = motion.div;

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  console.warn("Missing VITE_CLERK_PUBLISHABLE_KEY. Auth features will be limited.");
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
  const preferences = useTrackerStore((s) => s.preferences);
  const decor = useProfileStore((s) => s.decor);
  const playClick = useThock();
  const { unlock: unlockRewards } = useMicroRewards();

  useEffect(() => {
    ensurePlayerId();
  }, [ensurePlayerId]);

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
        <main className={`relative flex min-h-screen flex-col overflow-x-hidden text-zinc-100 ${preferences.uiOptimized ? 'ui-optimized' : ''} ${preferences.disableAnimations ? 'no-animations' : ''}`}>
          <YoutubeMedia />
          <ThemeBackground cozyPreset={preferences.cozyPreset} />
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
      {AppContent}
    </ClerkProvider>
  );
}

export default App;
