import { 
  useTrackRefContext, 
  VideoTrack, 
  useParticipantInfo,
  ParticipantContext,
  TrackRefContext
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Coffee, User, Flame, Zap } from 'lucide-react';
import { useLiveRoomStore } from '../../store/useLiveRoomStore';
import { useThock } from '../../hooks/useThock';
import { useState, useContext } from 'react';

export function ParticipantTile({ trackRef }) {
  const participant = trackRef.participant;
  const { identity, metadata } = useParticipantInfo({ participant });
  const { pinnedUsers, togglePin, mirrorVideo } = useLiveRoomStore();
  const playThock = useThock();
  const [showFistEffect, setShowFistEffect] = useState(false);

  const isPinned = pinnedUsers.includes(identity);
  const parsedMetadata = metadata ? JSON.parse(metadata) : {};
  const { task = 'Grinding Modules...', isBreak = false, rank = 'Aspirant' } = parsedMetadata;

  const handlePin = () => {
    togglePin(identity);
    playThock();
  };

  const triggerBroFist = (e) => {
    e.stopPropagation();
    setShowFistEffect(true);
    setTimeout(() => setShowFistEffect(false), 2000);
    // In a real app, you'd emit a LiveKit data message here
  };

  return (
    <motion.div 
      layout
      className={`relative aspect-video overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-md transition-all duration-500 ${
        isPinned ? 'ring-2 ring-fuchsia-500/50' : ''
      }`}
      onDoubleClick={handlePin}
    >
      {/* Video Content */}
      <div className={`h-full w-full transition-opacity duration-500 ${isBreak ? 'opacity-40' : 'opacity-100'}`}>
        <ParticipantContext.Provider value={participant}>
          <TrackRefContext.Provider value={trackRef}>
            <CustomVideoTrack identity={identity} isLocal={participant.isLocal} />
          </TrackRefContext.Provider>
        </ParticipantContext.Provider>
      </div>

      {/* Break Mode Overlay */}
      {isBreak && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2">
            <Coffee className="h-8 w-8 text-fuchsia-400 animate-pulse" />
            <span className="font-mono text-xs text-white/90 bg-black/40 px-3 py-1 rounded-full border border-white/10">
              [ On Chai Break - Away from Desk ]
            </span>
          </div>
        </div>
      )}

      {/* Top Banner: Username (Rank) */}
      <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-md border border-white/5">
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-bold text-white/90 uppercase tracking-wider">
            {identity} <span className="text-zinc-400 font-medium">({rank})</span>
          </span>
        </div>
        
        <button 
          onClick={handlePin}
          className={`p-1.5 rounded-full backdrop-blur-md transition ${
            isPinned ? 'bg-fuchsia-500 text-white' : 'bg-black/50 text-white/50 hover:text-white'
          }`}
        >
          <Pin className="h-3 w-3" />
        </button>
      </div>

      {/* Bottom Ticker: Current Task */}
      <div className="absolute bottom-2 left-2 right-2">
        <div className="flex items-center gap-2 rounded-lg bg-zinc-900/80 px-3 py-1.5 backdrop-blur-md border border-white/5 overflow-hidden">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-fuchsia-500 animate-pulse" />
          <div className="flex-1 overflow-hidden">
            <p className="whitespace-nowrap text-[10px] font-medium text-zinc-300 animate-marquee">
              {task} • {task} • {task}
            </p>
          </div>
        </div>
      </div>

      {/* Bro Fist Button */}
      {!participant.isLocal && (
        <button 
          onClick={triggerBroFist}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white/60 hover:bg-fuchsia-500/80 hover:text-white transition group"
        >
          <Flame className="h-4 w-4 group-hover:scale-110 transition" />
        </button>
      )}

      {/* Floating Emoji Explosion */}
      <AnimatePresence>
        {showFistEffect && (
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.5 }}
            animate={{ y: -60, opacity: 1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 flex gap-2"
          >
            <Zap className="text-yellow-400 h-6 w-6" />
            <Flame className="text-orange-500 h-6 w-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CustomVideoTrack({ identity, isLocal }) {
  const { mirrorVideo } = useLiveRoomStore();
  const trackRef = useTrackRefContext();
  
  // If track is missing or muted, show placeholder
  if (!trackRef || trackRef.publication?.isMuted) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-900/80">
        <div className="relative">
          <div className="absolute inset-0 blur-2xl bg-fuchsia-500/20 rounded-full" />
          <User className="h-12 w-12 text-zinc-700 relative z-10" />
        </div>
        <div className="mt-4 flex flex-col items-center gap-1">
          <div className="flex gap-1">
            <div className="h-1 w-1 rounded-full bg-zinc-800" />
            <div className="h-1 w-1 rounded-full bg-zinc-800" />
            <div className="h-1 w-1 rounded-full bg-zinc-800" />
          </div>
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Off-Cam Study</p>
        </div>
      </div>
    );
  }

  return (
    <VideoTrack 
      trackRef={trackRef} 
      className="h-full w-full object-cover" 
      style={{ 
        transform: (isLocal && mirrorVideo) ? 'scaleX(-1)' : 'none' 
      }} 
    />
  );
}
