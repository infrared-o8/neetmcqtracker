import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Package, Sparkles, X, ChevronRight, Trophy } from 'lucide-react';
import { RARITY_TIERS, rollLoot } from '../../utils/lootEngine';
import { useProfileStore } from '../../store/useProfileStore';

export function CaseUnlockView({ crateType, onDismiss, onSave }) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [wonItem, setWonItem] = useState(null);
  const { addUnlockedItem } = useProfileStore();

  const handleUnlock = useCallback(() => {
    setIsRevealing(true);
    
    // Instant roll
    const item = rollLoot();
    
    // Sudden impact pulse effect (handled by framer-motion)
    setTimeout(() => {
      setWonItem(item);
      addUnlockedItem(item);
      
      // Explosive particle burst matching rarity
      const colors = [item.rarityData.color, '#ffffff'];
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: colors,
        startVelocity: 45,
        gravity: 1.2,
        ticks: 200,
        shapes: ['circle', 'square'],
      });
    }, 150);
  }, [addUnlockedItem]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
      <div className="relative w-full max-w-md p-6">
        <AnimatePresence mode="wait">
          {!wonItem ? (
            <motion.div
              key="crate"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.2, opacity: 0 }}
              className="genz-glass rounded-[2rem] border-white/10 bg-zinc-900/60 p-8 text-center shadow-2xl"
            >
              <div className="relative mx-auto mb-6 h-32 w-32">
                <div className="absolute inset-0 animate-ping rounded-full bg-fuchsia-500/20" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full border border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-600/20 to-indigo-600/20 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
                  <Package className="h-16 w-12 text-fuchsia-400" />
                </div>
              </div>

              <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                {crateType === 'ASH_STASH' ? 'Aspirant Stash' : 'Star Batch Crate'}
              </h2>
              <p className="mt-2 text-sm font-medium text-zinc-400 uppercase tracking-widest">
                Milestone Reward Earned
              </p>

              <div className="mt-8 flex flex-col gap-3">
                <button
                  onClick={handleUnlock}
                  disabled={isRevealing}
                  className="group relative w-full overflow-hidden rounded-2xl bg-white py-4 text-sm font-black uppercase tracking-[0.2em] text-black transition-all active:scale-95 disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Unlock Now <ChevronRight className="h-4 w-4" />
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-black/5 to-transparent transition-transform group-hover:translate-x-full" />
                </button>
                
                <button
                  onClick={onSave || onDismiss}
                  disabled={isRevealing}
                  className="w-full rounded-2xl border border-white/10 bg-zinc-800/40 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-800 hover:text-white transition"
                >
                  Save for later
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="item"
              initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              className="flex flex-col items-center"
            >
              {/* Item Card */}
              <div className={`relative w-full overflow-hidden rounded-[2.5rem] border-2 p-1 ${wonItem.style || 'border-zinc-700 bg-zinc-800/40 shadow-2xl'}`}>
                <div className="rounded-[2.4rem] bg-zinc-950/40 p-8 text-center backdrop-blur-md">
                  <div className="mb-4 flex items-center justify-center gap-2">
                    <Sparkles className="h-4 w-4" style={{ color: wonItem.rarityData.color }} />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: wonItem.rarityData.color }}>
                      {wonItem.rarityData.label} UNLOCK
                    </span>
                  </div>

                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">
                    {wonItem.label}
                  </h3>
                  <p className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {wonItem.type === 'title' ? 'Exclusive Profile Title' : 'Premium Frame Decor'}
                  </p>

                  <div className="mt-8 flex justify-center">
                    {wonItem.type === 'title' ? (
                      <div className="rounded-lg bg-white/5 px-4 py-2 font-mono text-sm text-zinc-300 border border-white/5">
                        "{wonItem.label}"
                      </div>
                    ) : (
                      <div className={`h-20 w-32 rounded-xl border-2 ${wonItem.style} opacity-80`} />
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={onDismiss}
                className="mt-8 flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition uppercase tracking-widest"
              >
                Close & Continue <X className="h-3 w-3" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
