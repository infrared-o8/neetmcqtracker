import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import { StudySidebar } from "./components/StudySidebar";
import { YoutubeMedia } from "./components/YoutubeMedia";
import { ThemeBackground } from "./components/ThemeBackground";
import { Dashboard } from "./pages/Dashboard";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import StudyRoomPage from "./pages/StudyRoomPage";
import { useProfileStore } from "./store/useProfileStore";
import { useTrackerStore } from "./store/useTrackerStore";
import { FaceStudyProvider } from "./context/FaceStudyProvider";
import { useThock } from "./hooks/useThock";

const MotionDiv = motion.div;

function App() {
  const ensurePlayerId = useProfileStore((s) => s.ensurePlayerId);
  const preferences = useTrackerStore((s) => s.preferences);
  const playClick = useThock();

  useEffect(() => {
    ensurePlayerId();
  }, [ensurePlayerId]);

  // Global click listener for snappy audio feedback
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Find the closest interactive element (button, link, input[type=button/submit/checkbox/radio], or elements with onclick)
      const target = e.target;
      const interactive = target.closest('button, a, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], [role="button"], .cursor-pointer');
      
      if (interactive) {
        playClick();
      }
    };

    window.addEventListener("click", handleGlobalClick, { capture: true });
    return () => window.removeEventListener("click", handleGlobalClick, { capture: true });
  }, [playClick]);

  return (
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
          <div className="flex min-h-screen flex-1">
            <StudySidebar />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/study-room" element={<StudyRoomPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </div>
        </MotionDiv>
      </main>
      </FaceStudyProvider>
    </BrowserRouter>
  );
}

export default App;
