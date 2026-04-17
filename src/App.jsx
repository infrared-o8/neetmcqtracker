import { motion } from "framer-motion";
import { Dashboard } from "./pages/Dashboard";
import { TitleBar } from "./components/TitleBar";

const MotionDiv = motion.div;

function App() {
  return (
    <main className="relative min-h-screen overflow-x-hidden text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.22),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(34,211,238,0.2),transparent_35%),radial-gradient(circle_at_55%_92%,rgba(244,63,94,0.1),transparent_30%)]" />
      <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.38 }}>
        <TitleBar />
        <Dashboard />
      </MotionDiv>
    </main>
  );
}

export default App;
