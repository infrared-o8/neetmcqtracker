import { 
  Camera, 
  CameraOff, 
  RefreshCcw, 
  Battery, 
  Zap, 
  Coffee, 
  Send,
  Users,
  Settings2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useLiveRoomStore } from '../../store/useLiveRoomStore';
import { useState, useEffect } from 'react';
import { useLocalParticipant, useRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { motion, AnimatePresence } from 'framer-motion';

export function RoomSidebar({ participantCount = 0 }) {
  const { 
    currentTask, 
    setCurrentTask, 
    videoResolution, 
    setVideoResolution,
    mirrorVideo,
    setMirrorVideo,
    isBreakMode,
    setBreakMode,
    isCamOff,
    setCamOff
  } = useLiveRoomStore();
  
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [taskDraft, setTaskDraft] = useState(currentTask);
  const [showSettings, setShowSettings] = useState(false);

  const updateMetadata = () => {
    if (!localParticipant || room.state !== ConnectionState.Connected) return;
    try {
      const metadata = JSON.stringify({
        task: taskDraft,
        isBreak: isBreakMode,
        isMirrored: mirrorVideo,
        isCamOff: isCamOff,
        rank: 'Elite Aspirant'
      });
      localParticipant.setMetadata(metadata);
      setCurrentTask(taskDraft);
    } catch (e) {
      console.warn('Failed to update metadata:', e);
    }
  };

  useEffect(() => {
    updateMetadata();
  }, [isBreakMode, mirrorVideo, isCamOff]);

  return (
    <div className="flex w-full flex-col gap-6 p-4 pb-20">
      {/* Live Occupancy Meter */}
      <div className="flex items-center gap-3 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20 p-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-fuchsia-400 opacity-20" />
          <div className="relative h-3 w-3 rounded-full bg-fuchsia-500" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-fuchsia-300 uppercase tracking-widest">Live Room</span>
          <span className="font-mono text-sm font-semibold text-white">
            {participantCount} aspirants cooking live
          </span>
        </div>
      </div>

      {/* Task Input */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Focus Target</p>
        <div className="relative group">
          <input
            type="text"
            value={taskDraft}
            onChange={(e) => setTaskDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && updateMetadata()}
            placeholder="What are you solving?..."
            className="w-full rounded-xl border border-white/5 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none ring-fuchsia-500/30 transition focus:ring-2"
          />
          <button 
            onClick={updateMetadata}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-fuchsia-500/20 text-fuchsia-400 opacity-0 group-focus-within:opacity-100 transition hover:bg-fuchsia-500/40"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Toggles */}
      <div className="grid grid-cols-2 gap-2">
        <ToggleButton 
          active={!isCamOff} 
          onClick={() => {
            setCamOff(!isCamOff);
            localParticipant?.setCameraEnabled(isCamOff);
          }}
          icon={isCamOff ? CameraOff : Camera}
          label={isCamOff ? "Cam Off" : "Cam On"}
        />
        <ToggleButton 
          active={isBreakMode} 
          onClick={() => setBreakMode(!isBreakMode)}
          icon={Coffee}
          label="Break Mode"
        />
      </div>

      {/* Settings Deck - Collapsible */}
      <div className="space-y-2">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex w-full items-center justify-between rounded-xl bg-zinc-900/40 border border-white/5 p-4 text-xs font-bold text-zinc-400 hover:text-white transition group"
        >
          <div className="flex items-center gap-2">
            <Settings2 className={`h-4 w-4 transition-transform duration-500 ${showSettings ? 'rotate-90 text-fuchsia-400' : ''}`} />
            <span className="uppercase tracking-widest">Atmospheric Deck</span>
          </div>
          {showSettings ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4 text-zinc-600" />}
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-4 rounded-2xl bg-zinc-900/40 border border-white/5 p-4 mt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">Mirror Feed</span>
                  <button 
                    onClick={() => setMirrorVideo(!mirrorVideo)}
                    className={`h-5 w-10 rounded-full transition relative ${mirrorVideo ? 'bg-fuchsia-500' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${mirrorVideo ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs text-zinc-400">Resolution Gatekeeper</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setVideoResolution('high')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-bold uppercase transition ${
                        videoResolution === 'high' ? 'bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30' : 'bg-white/5 text-zinc-500 border border-transparent'
                      }`}
                    >
                      <Zap className="h-3 w-3" />
                      High
                    </button>
                    <button 
                      onClick={() => setVideoResolution('low')}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-[10px] font-bold uppercase transition ${
                        videoResolution === 'low' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-zinc-500 border border-transparent'
                      }`}
                    >
                      <Battery className="h-3 w-3" />
                      Saver
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToggleButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-xl border py-4 transition ${
        active 
          ? 'bg-fuchsia-500/20 border-fuchsia-500/40 text-fuchsia-100' 
          : 'bg-zinc-900/40 border-white/5 text-zinc-500 hover:text-zinc-300'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

