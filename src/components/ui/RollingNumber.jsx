import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAmbientAudio } from "../../hooks/useAmbientAudio";

export function RollingNumber({ value, className = "" }) {
  const [display, setDisplay] = useState(value);
  const { playThock } = useAmbientAudio();
  const prevValueRef = useRef(value);
  const lastSoundTimeRef = useRef(0);

  useEffect(() => {
    if (value === prevValueRef.current) return;
    
    const target = value;
    const start = prevValueRef.current;
    const diff = target - start;
    
    if (diff <= 0) {
      setDisplay(target);
      prevValueRef.current = target;
      return;
    }

    let current = start;
    const totalDuration = 1500; // Cap total animation at 1.5s
    const startTime = performance.now();

    const tick = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      
      // Easing function for smooth acceleration/deceleration
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      
      // Calculate next value based on easing
      const nextValue = Math.floor(start + (diff * easeOutExpo));
      
      if (nextValue > current) {
        current = nextValue;
        setDisplay(current);

        // Throttle sound to prevent audio distortion at high speeds
        // Max 15 sounds per second (approx 66ms apart)
        if (now - lastSoundTimeRef.current > 66) {
          playThock();
          lastSoundTimeRef.current = now;
        }
      }

      if (progress < 1 && current < target) {
        requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        prevValueRef.current = target;
      }
    };

    requestAnimationFrame(tick);
  }, [value, playThock]);

  return (
    <span className={`inline-flex overflow-hidden tabular-nums ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
        >
          {display.toLocaleString()}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
