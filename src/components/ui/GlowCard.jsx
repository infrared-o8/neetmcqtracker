export function GlowCard({ glow = false, className = "", children }) {
  return (
    <div
      className={`genz-glass rounded-3xl p-5 transition-all duration-500 ${glow ? "glow-border animate-glow-pulse" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
