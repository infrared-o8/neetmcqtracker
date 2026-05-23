import { useRef, useState } from "react";
import { motion } from "framer-motion";

const MotionButton = motion.button;

export function MagneticButton({ children, onClick, className = "", ...props }) {
  const ref = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setOffset({ x: dx * 10, y: dy * 10 });
  };

  return (
    <MotionButton
      ref={ref}
      type="button"
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      whileTap={{ scale: 0.94 }}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      className={`transition-transform duration-150 ${className}`}
      {...props}
    >
      {children}
    </MotionButton>
  );
}
