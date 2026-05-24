export function GlowCard({ glow = false, className = "", children, perf = false }) {
  return (
    <div
      className={`${perf ? "perf-glass" : "genz-glass"} rounded-3xl p-5 transition-all duration-500 ${glow ? "glow-border animate-glow-pulse" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
