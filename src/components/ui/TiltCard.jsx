import { useRef, useState } from "react";
import { useTrackerStore } from "../../store/useTrackerStore";

export function TiltCard({ className = "", lowSheen = false, children }) {
  const ref = useRef(null);
  const [transform, setTransform] = useState("");
  const [sheen, setSheen] = useState({ x: 50, y: 50 });
  const reduceGpuUsage = useTrackerStore((s) => s.preferences.reduceGpuUsage);

  const onMove = (e) => {
    if (reduceGpuUsage) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotX = (0.5 - y) * 12;
    const rotY = (x - 0.5) * 12;
    setTransform(`perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.02,1.02,1.02)`);
    setSheen({ x: x * 100, y: y * 100 });
  };

  const onLeave = () => {
    if (reduceGpuUsage) return;
    setTransform("perspective(800px) rotateX(0) rotateY(0) scale3d(1,1,1)");
  };

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ transform, transition: "transform 0.15s ease-out" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {!reduceGpuUsage && (
        <div
          className={`pointer-events-none absolute inset-0 ${lowSheen ? "opacity-[0.12]" : "opacity-40"}`}
          style={{
            background: `radial-gradient(circle at ${sheen.x}% ${sheen.y}%, rgba(255,255,255,${lowSheen ? "0.18" : "0.25"}), transparent 55%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
