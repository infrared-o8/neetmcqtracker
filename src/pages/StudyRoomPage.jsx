import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  ControlBar,
  useParticipants,
  useLocalParticipant,
  useTracks,
  GridLayout,
  ParticipantTile as LKParticipantTile
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomSidebar } from '../components/studyroom/RoomSidebar';
import { ParticipantTile } from '../components/studyroom/ParticipantTile';
import { useProfileStore } from '../store/useProfileStore';
import { useLiveRoomStore } from '../store/useLiveRoomStore';
import { useTrackerStore } from '../store/useTrackerStore';
import { apiFetch, apiUrl } from '../utils/api';
import { LayoutDashboard, ChevronDown, ChevronUp, Settings2, Maximize2, Minimize2, Zap, Trophy, MousePointer2 } from 'lucide-react';
import { RollingNumber } from '../components/ui/RollingNumber';
import { QuickAddControls } from '../components/QuickAddControls';
import { useMicroRewards } from '../hooks/useMicroRewards';
import { useLeaderboardSync } from '../hooks/useLeaderboardSync';
import {
  getActivityTotal,
  getRank,
  getRollingMcqSpeed,
  getTodayKey,
} from '../utils/gamification';

import { FaceStudyTopBar } from '../components/study/FaceStudyTopBar';
import { useFaceStudyContext } from '../hooks/useFaceStudyContext';

export default function StudyRoomPage() {
  const [token, setToken] = useState(null);
  const [lkUrl, setLkUrl] = useState(null);
  const [error, setError] = useState(null);
  const [showBottomStats, setShowStats] = useState(false);
  
  const { startCamera, stopCamera, videoRef } = useFaceStudyContext();

  useEffect(() => {
    // Automatically start AI tracking when entering the room
    startCamera();
    return () => stopCamera();
  }, []); // Remove dependencies to prevent rapid restart

  const displayName = useProfileStore((s) => s.displayName) || 'Aspirant';
  const serverUrl = useTrackerStore((s) => s.preferences.serverUrl);
  const { pinnedUsers, gridTileSize, setGridTileSize } = useLiveRoomStore();

  const totalSolved = useTrackerStore((s) => s.totalSolved);
  const totalPagesRead = useTrackerStore((s) => s.totalPagesRead);
  const dailyLogs = useTrackerStore((s) => s.dailyLogs);
  const dailyPageLogs = useTrackerStore((s) => s.dailyPageLogs);
  const streak = useTrackerStore((s) => s.streak);
  const studyMinutes = useTrackerStore((s) => s.studyMinutes);
  const mcqTimestamps = useTrackerStore((s) => s.mcqTimestamps);
  const pageTimestamps = useTrackerStore((s) => s.pageTimestamps);
  const momentumChain = useTrackerStore((s) => s.momentumChain);
  const trackingMode = useTrackerStore((s) => s.trackingMode);
  const addMcq = useTrackerStore((s) => s.addMcq);
  const addPages = useTrackerStore((s) => s.addPages);

  const { onIncrement } = useMicroRewards();
  const { scheduleSync } = useLeaderboardSync();

  const today = getTodayKey();
  const todaySolved = dailyLogs[today] ?? 0;
  const todayPages = dailyPageLogs[today] ?? 0;
  const activityTotal = getActivityTotal(totalSolved, totalPagesRead, studyMinutes);
  const { rank } = getRank(activityTotal);
  const isPages = trackingMode === 'pages';
  const timestamps = isPages ? pageTimestamps : mcqTimestamps;
  const currentSpeed = getRollingMcqSpeed(timestamps);

  const handleAdd = useCallback(
    (amount = 1) => {
      if (isPages) addPages(amount);
      else addMcq(amount);
      onIncrement();
      scheduleSync();
    },
    [isPages, addPages, addMcq, onIncrement, scheduleSync],
  );

  useEffect(() => {
    (async () => {
      const fetchToken = async (baseUrl) => {
        const url = apiUrl(baseUrl, '/api/livekit/token');
        console.log(`Attempting to fetch token from: ${url}`);
        const resp = await apiFetch(baseUrl, '/api/livekit/token', {
          method: 'POST',
          body: JSON.stringify({ playerName: displayName }),
        });
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        return resp.json();
      };

      try {
        let data;
        try {
          data = await fetchToken(serverUrl);
        } catch (e) {
          if (serverUrl) {
            console.log('configured serverUrl failed, trying local fallback...');
            data = await fetchToken('');
          } else {
            throw e;
          }
        }

        setToken(data.token);
        setLkUrl(data.serverUrl);
      } catch (e) {
        console.error('Failed to fetch LiveKit token:', e);
        setError(e.message === 'Failed to fetch' 
          ? 'Cannot reach server. Check if "npm run server" is running.' 
          : e.message);
      }
    })();
  }, [displayName, serverUrl]);

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-950/50 backdrop-blur-xl">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <p className="text-red-400 font-medium">Connection Failed</p>
          <p className="mt-2 text-xs text-zinc-500 font-mono">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-bold hover:bg-zinc-700 transition"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!token || !lkUrl) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-zinc-950/50 backdrop-blur-xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
        <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest animate-pulse">
          Connecting to Study Grid...
        </p>
      </div>
    );
  }

  return (
    <>
      <LiveKitRoom
        video={true}
        audio={false} 
        token={token}
        serverUrl={lkUrl}
        onConnected={() => console.log('Connected to LiveKit')}
        onDisconnected={() => setToken(null)}
        className="flex h-full flex-col overflow-hidden bg-zinc-950/20"
      >
        {/* Hidden video for AI detection logic */}
        <video ref={videoRef} className="hidden" playsInline muted />

        <div className="flex h-full flex-1 overflow-hidden relative">
          {/* Left Panel: Sidebar Stack */}
          <aside className="hidden w-[320px] shrink-0 flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-md lg:flex">
            <div className="flex-1 overflow-y-auto">
              <RoomSidebarContent />
            </div>
          </aside>

          {/* Main Panel: Fluid Grid */}
          <main className="flex-1 overflow-y-auto pb-24">
            <div className="p-4 md:p-6 lg:p-8">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4 text-fuchsia-400" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Collaborative Grid</h2>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-black/40 p-1 border border-white/5">
                  {(['small', 'medium', 'large']).map((size) => (
                    <button
                      key={size}
                      onClick={() => setGridTileSize(size)}
                      className={`rounded px-2 py-1 text-[10px] font-bold uppercase transition ${
                        gridTileSize === size 
                          ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/20' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {size[0]}
                    </button>
                  ))}
                </div>
              </div>
              
              <StudyGrid />

              {/* Collapsible Personal Tracker - Positioned below grid */}
              <div className="mt-12 rounded-3xl border border-white/5 bg-zinc-900/20 backdrop-blur-md overflow-hidden">
              <button 
                onClick={() => setShowStats(!showBottomStats)}
                className="flex w-full items-center justify-center gap-2 py-3 text-zinc-500 hover:text-zinc-300 transition group relative"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                {showBottomStats ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="text-[10px] font-bold uppercase tracking-[0.4em]">Personal Tracker · Quick Add</span>
              </button>
              
              <AnimatePresence>
                {showBottomStats && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/5 bg-black/40"
                  >
                    <div className="flex flex-col lg:flex-row gap-6 p-6 lg:p-8">
                      {/* Irregular Stats Layout: Auto-adjusting flex-basis based on content length */}
                      <div className="flex flex-wrap gap-3 flex-1 min-w-0">
                        <StatBox 
                          label="Today MCQs" 
                          value={todaySolved} 
                          color="text-fuchsia-400" 
                          icon={<Zap className="h-3 w-3" />}
                        />
                        <StatBox 
                          label="NCERT Bio" 
                          value={todayPages} 
                          color="text-cyan-400" 
                          icon={<Zap className="h-3 w-3" />}
                        />
                        <StatBox 
                          label="Velocity" 
                          value={currentSpeed} 
                          color="text-emerald-400" 
                          suffix=" MCQ/h"
                          icon={<MousePointer2 className="h-3 w-3" />}
                        />
                        <StatBox 
                          label="Current Rank" 
                          value={rank.label} 
                          color="chroma-text" 
                          icon={<Trophy className="h-3 w-3" />}
                          isText
                        />
                        <StatBox 
                          label="Day Streak" 
                          value={streak} 
                          color="text-orange-400" 
                          suffix="d"
                          icon={<Zap className="h-3 w-3" />}
                        />
                        <StatBox 
                          label="Total Activity" 
                          value={activityTotal} 
                          color="text-indigo-400" 
                          icon={<Zap className="h-3 w-3" />}
                        />
                      </div>
                      {/* Quick Add Section: Stylized and distinct */}
                      <div className="lg:w-64 flex flex-col items-center gap-3 bg-white/5 rounded-3xl p-5 border border-white/5 shrink-0">
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/5 w-full">
                          <button 
                            onClick={() => useTrackerStore.setState({ trackingMode: 'mcq' })}
                            className={`flex-1 px-2 py-1 text-[9px] font-black uppercase rounded-md transition ${!isPages ? 'bg-fuchsia-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            MCQ
                          </button>
                          <button 
                            onClick={() => useTrackerStore.setState({ trackingMode: 'pages' })}
                            className={`flex-1 px-2 py-1 text-[9px] font-black uppercase rounded-md transition ${isPages ? 'bg-cyan-500 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                          >
                            BIO
                          </button>
                        </div>
                        <div className="scale-[0.7] lg:scale-[0.85] origin-top">
                          <QuickAddControls
                            onAdd={handleAdd}
                            label={isPages ? "Page" : "MCQ"}
                            showCombo={momentumChain >= 2}
                            comboCount={momentumChain}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>

      <RoomAudioRenderer />
    </LiveKitRoom>
    <FaceStudyTopBar />
    </>
  );
}

function StatBox({ label, value, color, icon, suffix = "", isText = false }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 p-4 flex flex-col items-center justify-center text-center group relative overflow-hidden min-w-[120px] flex-grow w-auto">
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-2 flex items-center justify-center gap-1.5 whitespace-nowrap">
        {icon} {label}
      </p>
      <div className={`text-sm sm:text-base font-bold ${color === 'chroma-text' ? 'chroma-text' : color} relative z-10 leading-tight truncate w-full px-1`}>
        {isText ? value : <><RollingNumber value={value} />{suffix}</>}
      </div>
    </div>
  );
}

function RoomSidebarContent() {
  const participants = useParticipants();
  return <RoomSidebar participantCount={participants.length} />;
}

function StudyGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, name: 'camera' },
      { source: Track.Source.ScreenShare, name: 'screen_share' },
    ],
    { onlySubscribed: false },
  );

  const { pinnedUsers, gridTileSize } = useLiveRoomStore();

  const sortedTracks = [...tracks].sort((a, b) => {
    const aIdentity = a.participant.identity;
    const bIdentity = b.participant.identity;
    
    if (pinnedUsers.includes(aIdentity) && !pinnedUsers.includes(bIdentity)) return -1;
    if (!pinnedUsers.includes(aIdentity) && pinnedUsers.includes(bIdentity)) return 1;
    
    if (a.participant.isLocal && !b.participant.isLocal) return -1;
    if (!a.participant.isLocal && b.participant.isLocal) return 1;
    
    return 0;
  });

  const gridCols = {
    small: 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6',
    medium: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
    large: 'grid-cols-1 xl:grid-cols-2'
  };

  return (
    <div className={`grid gap-4 ${gridCols[gridTileSize] || gridCols.medium}`}>
      {sortedTracks.map((track) => (
        <ParticipantTile 
          key={`${track.participant.identity}-${track.source}`} 
          trackRef={track} 
        />
      ))}
      
      {tracks.length === 0 && (
        <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-white/5">
          <p className="text-sm text-zinc-600">Waiting for other aspirants to join...</p>
        </div>
      )}
    </div>
  );
}
