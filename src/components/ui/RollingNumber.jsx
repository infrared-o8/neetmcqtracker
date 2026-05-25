import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAmbientAudio } from "../../hooks/useAmbientAudio";

export function RollingNumber({ value, className = "" }) {
  const [display, setDisplay] = useState(value);
  const { playThock } = useAmbientAudio();
  
  // Track the actual current value being shown to the user
  const currentInternalValueRef = useRef(value);
  const targetValueRef = useRef(value);
  const requestRef = useRef(null);
  const lastSoundTimeRef = useRef(0);

  useEffect(() => {
    // If the target hasn't changed, do nothing
    if (value === targetValueRef.current) return;
    
    targetValueRef.current = value;
    const startValue = currentInternalValueRef.current;
    const diff = value - startValue;
    
    if (diff === 0) return;

    const totalDuration = 1000; // Snappier 1s duration
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      
      // Easing function for smooth acceleration/deceleration
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      
      // Calculate next value based on easing from current position
      // Using Math.round to avoid the 'floor lag' for small increments (+1, +2)
      const nextValue = Math.round(startValue + (diff * easeOutExpo));
      
      if (nextValue !== currentInternalValueRef.current) {
        currentInternalValueRef.current = nextValue;
        setDisplay(nextValue);

        // Throttle sound to prevent audio distortion at high speeds
        if (time - lastSoundTimeRef.current > 70) {
          playThock();
          lastSoundTimeRef.current = time;
        }
      }

      if (progress < 1) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        currentInternalValueRef.current = value;
        setDisplay(value);
      }
    };

    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
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
