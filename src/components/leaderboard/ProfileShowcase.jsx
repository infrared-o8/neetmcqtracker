import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileDecorCard } from "./ProfileDecorCard";
import { ParticleEngine } from "../ParticleEngine";
import { FRAMES, DEFAULT_DECOR } from "../../data/profileDecor";
import { useTrackerStore } from "../../store/useTrackerStore";

export function ProfileShowcase({ player, open, onClose, onPanelEnter, onPanelLeave }) {
  const panelRef = useRef(null);
  const preferences = useTrackerStore((s) => s.preferences);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!player) return null;

  const decor = { ...DEFAULT_DECOR, ...(player.decor || {}) };
  const activeEffect = FRAMES[decor.frameId]?.name || 'Dust';

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sol's RNG Special Effect - Only active during showcase */}
          {!preferences.uiOptimized && !preferences.disableAnimations && (
            <div className="fixed inset-0 z-[251] pointer-events-none">
              <ParticleEngine 
                effect={activeEffect} 
                highIntensity={preferences.highIntensityFx} 
              />
            </div>
          )}

          <motion.div
            ref={panelRef}
            className="fixed left-1/2 top-1/2 z-[252] w-[min(340px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: "spring", damping: 16, stiffness: 200 }}
            onMouseEnter={onPanelEnter}
            onMouseLeave={onPanelLeave}
            onClick={(e) => e.stopPropagation()}
          >
            <ProfileDecorCard player={player} />
            <p className="mt-2 text-center text-[10px] text-zinc-500">
              Press Esc or click outside to close
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
