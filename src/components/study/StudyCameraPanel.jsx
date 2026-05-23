import { useFaceStudyContext } from "../../hooks/useFaceStudyContext";
import { useTrackerStore } from "../../store/useTrackerStore";

/** Compact sidebar status — full controls live on the dashboard card. */
export function StudyCameraPanel() {
  const studyMinutesToday = useTrackerStore((s) => s.studyMinutesToday);
  const { active, faceDetected, startCamera, stopCamera, loading } = useFaceStudyContext();

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/50 p-3">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Face study</p>
      <p className="mt-1 text-[10px] leading-relaxed text-zinc-600">
        Main camera card is on the dashboard. Today:{" "}
        <span className="font-semibold text-emerald-300">{studyMinutesToday}m</span>
      </p>
      <p className="mt-2 text-[10px] text-zinc-500">
        {active ? (faceDetected ? "● Recording face time" : "○ Camera on — find your face") : "○ Camera off"}
      </p>
      <button
        type="button"
        onClick={active ? stopCamera : startCamera}
        disabled={loading}
        className="mt-2 w-full rounded-xl border border-white/10 py-1.5 text-[10px] font-medium text-zinc-300 hover:bg-white/5"
      >
        {loading ? "…" : active ? "Stop from sidebar" : "Quick start"}
      </button>
    </div>
  );
}
