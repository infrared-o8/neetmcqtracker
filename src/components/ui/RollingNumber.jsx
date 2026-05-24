import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function RollingNumber({ value, className = "" }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  return (
    <span className={`inline-flex overflow-hidden tabular-nums ${className}`}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
        >
          {display.toLocaleString()}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
