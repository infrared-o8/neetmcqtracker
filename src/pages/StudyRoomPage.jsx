import { 
  LiveKitRoom, 
  RoomAudioRenderer, 
  useParticipants,
  useTracks,
  useLocalParticipant
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RoomSidebar } from '../components/studyroom/RoomSidebar';
import { ParticipantTile } from '../components/studyroom/ParticipantTile';
import { useProfileStore } from '../store/useProfileStore';
import { useLiveRoomStore } from '../store/useLiveRoomStore';
import { useTrackerStore } from '../store/useTrackerStore';
import { apiFetch, apiUrl } from '../utils/api';
import { 
  LayoutDashboard, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Trophy, 
  MousePointer2, 
  Plus, 
  Users, 
  Lock, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  Globe,
  Loader2,
  AlertCircle,
  LogOut,
  Mic,
  MicOff,
  Video,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { RollingNumber } from '../components/ui/RollingNumber';
import { QuickAddControls } from '../components/QuickAddControls';
import { useMicroRewards } from '../hooks/useMicroRewards';
import { useLeaderboardSync } from '../hooks/useLeaderboardSync';
import { useAuth } from "../hooks/useAuthShim";
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
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(null); // { roomId, title }
  const [roomPassword, setRoomPassword] = useState('');
  
  const { getToken, userId: clerkUserId } = useAuth();
  const { startCamera, stopCamera, videoRef } = useFaceStudyContext();
  
  const profileDisplayName = useProfileStore((s) => s.displayName);
  const profilePlayerId = useProfileStore((s) => s.playerId);
  const serverUrl = useTrackerStore((s) => s.preferences.serverUrl);
  const { gridTileSize, setGridTileSize, currentTask, isBreakMode, mirrorVideo } = useLiveRoomStore();
  const { active } = useFaceStudyContext();

  const displayName = profileDisplayName || 'Aspirant';
  const playerId = clerkUserId || profilePlayerId;

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const res = await apiFetch(serverUrl, '/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
      }
    } catch (e) {
      console.error('Failed to fetch rooms:', e);
    } finally {
      setLoadingRooms(false);
    }
  }, [serverUrl]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const joinRoom = useCallback(async (roomData, password = '') => {
    setError(null);
    const roomId = roomData.roomId;
    try {
      const tokenRes = await apiFetch(serverUrl, '/api/livekit/token', {
        method: 'POST',
        body: JSON.stringify({ 
          playerName: displayName, 
          roomName: roomId,
          password: password 
        }),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        let errorMsg = 'Failed to join room';
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || errorMsg;
        } catch {
          errorMsg = `Server error ${tokenRes.status}: ${text.slice(0, 50)}...`;
        }
        throw new Error(errorMsg);
      }

      const data = await tokenRes.json();
      setToken(data.token);
      setLkUrl(data.serverUrl);
      setActiveRoomId(roomId);
      setActiveRoom(roomData);
      setShowPasswordModal(null);
      setRoomPassword('');
      startCamera();
    } catch (e) {
      setError(e.message);
    }
  }, [serverUrl, displayName, startCamera]);

  const deleteRoom = useCallback(async (roomId) => {
    try {
      const token = clerkUserId ? await getToken() : null;
      const res = await apiFetch(serverUrl, `/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          'X-Player-Id': playerId,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        fetchRooms();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete room');
      }
    } catch (e) {
      console.error('Delete room error:', e);
    }
  }, [serverUrl, playerId, clerkUserId, getToken, fetchRooms]);

  const leaveRoom = () => {
    setToken(null);
    setLkUrl(null);
    setActiveRoomId(null);
    setActiveRoom(null);
    stopCamera();
    fetchRooms();
  };

  if (activeRoomId && token && lkUrl) {
    const isGlobal = activeRoomId === 'NEET-Study-Room';
    const audioEnabled = !isGlobal && activeRoom?.isMicOpen;

    return (
      <LiveKitRoom
        video={true}
        audio={audioEnabled} 
        token={token}
        serverUrl={lkUrl}
        onDisconnected={leaveRoom}
        className="flex h-full flex-col overflow-hidden bg-zinc-950"
      >
        <RoomView 
          roomId={activeRoomId} 
          onLeave={leaveRoom} 
          videoRef={videoRef}
          showBottomStats={showBottomStats}
          setShowStats={setShowStats}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMicOpen={audioEnabled}
        />
      </LiveKitRoom>
    );
  }

  return (
    <div className="min-h-full bg-zinc-950 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-white">Study Grid Lobby</h1>
            <p className="mt-2 text-zinc-500 font-medium">Join a focused study space or create your own.</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="group flex items-center gap-3 rounded-2xl bg-fuchsia-600 px-6 py-4 font-black uppercase tracking-widest text-white shadow-xl shadow-fuchsia-500/20 transition-all hover:bg-fuchsia-500 active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Create Live Room
          </button>
        </header>

        {error && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-bold uppercase tracking-wide">{error}</p>
            <button onClick={() => setError(null)} className="ml-auto text-xs font-black uppercase opacity-50 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {loadingRooms ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-10 w-10 animate-spin text-fuchsia-500" />
            <p className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-600">Scanning Study Frequency...</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Global Default Room */}
            <RoomCard 
              room={{
                roomId: 'NEET-Study-Room',
                title: 'Global High-Yield Hall',
                description: 'The official 24/7 focus hall for all aspirants. Open to everyone.',
                creatorName: 'System',
                capacity: 50,
                activeCount: 0, // Will be updated by enrichment if needed
                isPasswordProtected: false,
                isMicOpen: false
              }}
              onJoin={() => joinRoom({
                roomId: 'NEET-Study-Room',
                title: 'Global High-Yield Hall',
                isMicOpen: false
              })}
            />

            {rooms.map(room => (
              <RoomCard 
                key={room.roomId}
                room={room}
                onJoin={() => room.isPasswordProtected ? setShowPasswordModal(room) : joinRoom(room)}
                onDelete={() => deleteRoom(room.roomId)}
                isCreator={room.creatorId === playerId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateRoomModal 
            onClose={() => setShowCreateModal(false)} 
            onCreated={() => {
              setShowCreateModal(false);
              fetchRooms();
            }}
          />
        )}
        {showPasswordModal && (
          <PasswordModal 
            room={showPasswordModal}
            onClose={() => {
              setShowPasswordModal(null);
              setRoomPassword('');
            }}
            onJoin={(pwd) => joinRoom(showPasswordModal, pwd)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RoomCard({ room, onJoin, onDelete, isCreator }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-6 transition-all hover:border-fuchsia-500/30 hover:bg-zinc-900/60"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex gap-2">
          <div className="rounded-xl bg-white/5 p-2 text-zinc-400 group-hover:text-fuchsia-400 transition-colors">
            {room.isPasswordProtected ? <Lock className="h-5 w-5" /> : <Globe className="h-5 w-5" />}
          </div>
          {room.isMicOpen && (
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400">
              <Mic className="h-5 w-5" />
            </div>
          )}
        </div>
        {isCreator && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="rounded-lg p-2 text-zinc-600 hover:bg-red-500/10 hover:text-red-500 transition-all"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <h3 className="text-xl font-black text-white italic transition-colors group-hover:text-fuchsia-100">{room.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500 font-medium">{room.description}</p>

      <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-6">
        <div className="flex flex-col">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Creator</p>
          <p className="text-xs font-bold text-zinc-300">{room.creatorName}</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1.5 border border-white/5">
          <Users className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-black text-zinc-400">
            {room.activeCount ?? 0} / {room.capacity}
          </span>
        </div>
      </div>

      <button 
        onClick={onJoin}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-400 transition-all group-hover:bg-fuchsia-600 group-hover:text-white"
      >
        Enter Hall
        <ArrowRight className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

function CreateRoomModal({ onClose, onCreated }) {
  const [formData, setFormData] = useState({ title: '', description: '', capacity: 20, password: '', isMicOpen: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { getToken, userId: clerkUserId } = useAuth();
  const displayName = useProfileStore((s) => s.displayName) || 'Aspirant';
  const playerId = clerkUserId || useProfileStore((s) => s.playerId);
  const serverUrl = useTrackerStore((s) => s.preferences.serverUrl);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const token = clerkUserId ? await getToken() : null;
      const res = await apiFetch(serverUrl, '/api/rooms', {
        method: 'POST',
        headers: {
          'X-Player-Id': playerId,
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          ...formData,
          creatorId: playerId,
          creatorName: displayName
        })
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMsg = 'Failed to create room';
        try {
          const json = JSON.parse(text);
          errorMsg = json.error || errorMsg;
        } catch {
          errorMsg = `Server error ${res.status}: ${text.slice(0, 50)}...`;
        }
        throw new Error(errorMsg);
      }

      onCreated();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-zinc-900 p-8 shadow-2xl"
      >
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Blueprint New Hall</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Hall Title</label>
            <input 
              required maxLength={50}
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-2xl border border-white/5 bg-black/40 px-5 py-4 text-white outline-none focus:border-fuchsia-500/50"
              placeholder="e.g., Morning Biology Intensive"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Description</label>
            <textarea 
              maxLength={200} rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-2xl border border-white/5 bg-black/40 px-5 py-4 text-white outline-none focus:border-fuchsia-500/50 resize-none"
              placeholder="What are we focusing on?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Capacity (2-50)</label>
              <input 
                type="number" min={2} max={50}
                value={formData.capacity}
                onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full rounded-2xl border border-white/5 bg-black/40 px-5 py-4 text-white outline-none focus:border-fuchsia-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Keycode (Optional)</label>
              <input 
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-2xl border border-white/5 bg-black/40 px-5 py-4 text-white outline-none focus:border-fuchsia-500/50"
                placeholder="Private room key"
              />
            </div>
          </div>

          {/* Mic Open Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/40 p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2 ${formData.isMicOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                <Mic className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Mic Open Hall</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tight">Allow aspirants to speak freely</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({ ...formData, isMicOpen: !formData.isMicOpen })}
              className={`h-6 w-12 rounded-full transition relative ${formData.isMicOpen ? 'bg-fuchsia-600' : 'bg-zinc-800'}`}
            >
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${formData.isMicOpen ? 'right-1' : 'left-1'}`} />
            </button>
          </div>

          {error && <p className="text-xs font-bold text-red-400 bg-red-400/10 p-4 rounded-xl">{error}</p>}

          <button 
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-fuchsia-600 py-5 font-black uppercase tracking-[0.25em] text-white shadow-xl shadow-fuchsia-500/20 transition-all hover:bg-fuchsia-500 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Deploy Study Hall"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function PasswordModal({ room, onClose, onJoin }) {
  const [pwd, setPwd] = useState('');
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
        className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-zinc-900 p-8 text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20">
          <ShieldCheck className="h-8 w-8 text-fuchsia-400" />
        </div>
        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{room.title}</h2>
        <p className="mt-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">Identity Verification Required</p>
        
        <input 
          autoFocus type="password"
          value={pwd} onChange={e => setPwd(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onJoin(pwd)}
          placeholder="Enter Hall Passcode"
          className="mt-8 w-full rounded-2xl border border-white/5 bg-black/40 px-6 py-4 text-center text-white outline-none focus:border-fuchsia-500/50"
        />

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl bg-white/5 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:bg-white/10">Cancel</button>
          <button onClick={() => onJoin(pwd)} className="flex-1 rounded-xl bg-fuchsia-600 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-fuchsia-500/20 hover:bg-fuchsia-500">Authorize</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RoomView({ 
  roomId, 
  onLeave, 
  videoRef, 
  showBottomStats, 
  setShowStats,
  collapsed,
  onToggleCollapse,
  isMicOpen
}) {
  const { onIncrement } = useMicroRewards();
  const { scheduleSync } = useLeaderboardSync();
  const [streamsLoaded, setStreamsLoaded] = useState(false);

  // Track remote camera tracks specifically
  const remoteCameraTracks = useTracks(
    [{ source: Track.Source.Camera, name: 'camera' }],
    { onlySubscribed: true }
  ).filter(t => !t.participant.isLocal);

  const allParticipants = useParticipants();
  const remoteParticipants = allParticipants.filter(p => !p.isLocal);
  
  useEffect(() => {
    if (remoteParticipants.length === 0) {
      setStreamsLoaded(true);
      return;
    }
    const loadedIds = new Set(remoteCameraTracks.map(t => t.participant.sid));
    const allLoaded = remoteParticipants.every(p => loadedIds.has(p.sid));
    if (allLoaded) {
      const timer = setTimeout(() => setStreamsLoaded(true), 800);
      return () => clearTimeout(timer);
    }
  }, [remoteParticipants, remoteCameraTracks]);

  const totalSolved = useTrackerStore((s) => s.totalSolved);
  const totalPagesRead = useTrackerStore((s) => s.totalPagesRead);
  const dailyLogs = useTrackerStore((s) => s.dailyLogs);
  const dailyPageLogs = useTrackerStore((s) => s.dailyPageLogs);
  const streak = useTrackerStore((s) => s.streak);
  const studyMinutes = useTrackerStore((s) => s.studyMinutes);
  const momentumChain = useTrackerStore((s) => s.momentumChain);
  const trackingMode = useTrackerStore((s) => s.trackingMode);
  const addMcq = useTrackerStore((s) => s.addMcq);
  const addPages = useTrackerStore((s) => s.addPages);
  const { gridTileSize, setGridTileSize, currentTask, isBreakMode, mirrorVideo } = useLiveRoomStore();
  const { active } = useFaceStudyContext();

  const today = getTodayKey();
  const todaySolved = dailyLogs[today] ?? 0;
  const todayPages = dailyPageLogs[today] ?? 0;
  const activityTotal = getActivityTotal(totalSolved, totalPagesRead, studyMinutes);
  const { rank } = getRank(activityTotal);
  const isPages = trackingMode === 'pages';

  const handleAdd = useCallback(
    (amount = 1) => {
      if (isPages) addPages(amount);
      else addMcq(amount);
      onIncrement();
      scheduleSync();
    },
    [isPages, addPages, addMcq, onIncrement, scheduleSync],
  );

  return (
    <>
      <MetadataSync 
        task={currentTask} 
        isBreak={isBreakMode} 
        rank={rank.label} 
        isMirrored={mirrorVideo}
        isCamOff={!active}
      />
      <AnimatePresence>
        {!streamsLoaded && (
          <motion.div 
            initial={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950"
          >
            <div className="relative flex flex-col items-center">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-fuchsia-500 border-t-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="h-6 w-6 text-fuchsia-400 animate-pulse" />
              </div>
            </div>
            <h2 className="mt-8 text-xl font-black uppercase italic tracking-[0.3em] text-white">Synchronizing Streams</h2>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              Connecting to {remoteParticipants.length} remote frequency{remoteParticipants.length !== 1 ? 's' : ''}...
            </p>
            <div className="mt-12 flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scaleY: [1, 2, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  className="h-4 w-1 rounded-full bg-fuchsia-500"
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <video ref={videoRef} className="hidden" playsInline muted />
      <div className="flex h-full flex-1 overflow-hidden relative">
        <motion.aside 
          initial={false}
          animate={{ width: collapsed ? 0 : 320, opacity: collapsed ? 0 : 1 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="hidden shrink-0 flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-md lg:flex overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto">
            <RoomSidebarContent />
          </div>
          <div className="p-4 border-t border-white/5">
            <button onClick={onLeave} className="w-full rounded-xl bg-red-500/10 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 transition-colors hover:bg-red-500 hover:text-white">
              Exit Hall
            </button>
          </div>
        </motion.aside>

        <main className="flex-1 overflow-y-auto pb-24 relative">
          {/* Toggle Sidebar Button (Desktop) */}
          <button 
            onClick={onToggleCollapse}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 hidden lg:flex h-12 w-6 items-center justify-center rounded-r-xl bg-white/5 border border-l-0 border-white/10 text-zinc-500 hover:bg-white/10 hover:text-white transition-all"
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          <div className="p-4 md:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-fuchsia-500/10 p-2">
                  <LayoutDashboard className="h-5 w-5 text-fuchsia-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Active Study Grid</h2>
                    <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${isMicOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {isMicOpen ? <Mic className="h-2 w-2" /> : <MicOff className="h-2 w-2" />}
                      {isMicOpen ? 'Mic Open' : 'Mic Closed'}
                    </div>
                  </div>
                  <p className="text-sm font-bold text-white italic truncate max-w-[150px] sm:max-w-[300px]">{roomId}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={onLeave}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white"
                >
                  <LogOut className="h-3 w-3" />
                  Leave Room
                </button>

                <div className="flex items-center gap-1 rounded-2xl bg-black/40 p-1.5 border border-white/5">
                  {(['small', 'medium', 'large']).map((size) => (
                    <button
                      key={size}
                      onClick={() => setGridTileSize(size)}
                      className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase transition-all ${
                        gridTileSize === size 
                          ? 'bg-fuchsia-600 text-white shadow-lg' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {size[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <StudyGrid isMicOpen={isMicOpen} />

            <div className="mt-12 rounded-[2.5rem] border border-white/5 bg-zinc-900/20 backdrop-blur-md overflow-hidden">
              <button 
                onClick={() => setShowStats(!showBottomStats)}
                className="flex w-full items-center justify-center gap-2 py-4 text-zinc-500 hover:text-zinc-300 transition group relative"
              >
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
                {showBottomStats ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Command Center</span>
              </button>
              
              <AnimatePresence>
                {showBottomStats && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-white/5 bg-black/40"
                  >
                    <div className="flex flex-col lg:flex-row gap-6 p-8">
                      <div className="flex flex-wrap gap-4 flex-1">
                        <StatBox label="Today MCQ" value={todaySolved} color="text-fuchsia-400" icon={<Zap className="h-3 w-3" />} />
                        <StatBox label="Bio Pages" value={todayPages} color="text-cyan-400" icon={<Zap className="h-3 w-3" />} />
                        <StatBox label="Velocity" value={activityTotal > 0 ? Math.round(activityTotal / (studyMinutes / 60 || 1)) : 0} color="text-emerald-400" suffix=" /h" icon={<MousePointer2 className="h-3 w-3" />} />
                        <StatBox label="Rank" value={rank.label} color="chroma-text" icon={<Trophy className="h-3 w-3" />} isText />
                        <StatBox label="Streak" value={streak} color="text-orange-400" suffix="d" icon={<Zap className="h-3 w-3" />} />
                        <StatBox label="Activity" value={activityTotal} color="text-indigo-400" icon={<Zap className="h-3 w-3" />} />
                      </div>
                      <div className="lg:w-72 flex flex-col items-center gap-4 bg-white/5 rounded-[2rem] p-6 border border-white/5 shrink-0">
                        <div className="flex bg-black/60 rounded-xl p-1.5 border border-white/5 w-full">
                          <button 
                            onClick={() => useTrackerStore.setState({ trackingMode: 'mcq' })}
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!isPages ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-zinc-500'}`}
                          >MCQ</button>
                          <button 
                            onClick={() => useTrackerStore.setState({ trackingMode: 'pages' })}
                            className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${isPages ? 'bg-cyan-600 text-white shadow-lg' : 'text-zinc-500'}`}
                          >BIO</button>
                        </div>
                        <div className="scale-90 lg:scale-100">
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
      <FaceStudyTopBar />
    </>
  );
}

function StatBox({ label, value, color, icon, suffix = "", isText = false }) {
  return (
    <div className="rounded-3xl border border-white/5 bg-white/5 p-5 flex flex-col items-center justify-center text-center group relative overflow-hidden min-w-[140px] flex-grow">
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-2">
        {icon} {label}
      </p>
      <div className={`text-xl font-black ${color === 'chroma-text' ? 'chroma-text' : color} italic`}>
        {isText ? value : <><RollingNumber value={value} />{suffix}</>}
      </div>
    </div>
  );
}

function RoomSidebarContent() {
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useParticipants();
  const count = (localParticipant ? 1 : 0) + remoteParticipants.length;
  return <RoomSidebar participantCount={count} />;
}

function StudyGrid({ isMicOpen }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, name: 'camera' },
      { source: Track.Source.Microphone, name: 'microphone' },
      { source: Track.Source.ScreenShare, name: 'screen_share' },
    ],
    { onlySubscribed: false },
  );

  const { pinnedUsers, gridTileSize } = useLiveRoomStore();

  // Filter to only show one tile per participant (prefer camera)
  const participantTracks = useMemo(() => {
    const map = new Map();
    tracks.forEach(t => {
      const identity = t.participant.identity;
      const existing = map.get(identity);
      if (!existing || (t.source === Track.Source.Camera && existing.source !== Track.Source.Camera)) {
        map.set(identity, t);
      }
    });
    return Array.from(map.values());
  }, [tracks]);

  const sortedTracks = participantTracks.sort((a, b) => {
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
          isMicOpen={isMicOpen}
        />
      ))}
      {participantTracks.length === 0 && (
        <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-white/5 bg-white/5">
          <p className="text-sm font-bold uppercase tracking-widest text-zinc-700 italic">Waiting for Study Collective...</p>
        </div>
      )}
    </div>
  );
}

/**
 * MetadataSync: Synchronizes local participant state to LiveKit metadata
 * so other participants can see "Break Mode", "Current Task", etc.
 */
function MetadataSync({ task, isBreak, rank, isMirrored, isCamOff }) {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    if (!localParticipant) return;

    const metadata = JSON.stringify({
      task: task || 'Grinding Modules...',
      isBreak,
      rank,
      isMirrored,
      isCamOff
    });

    if (localParticipant.metadata !== metadata) {
      localParticipant.setMetadata(metadata).catch(err => 
        console.error("Failed to sync participant metadata:", err)
      );
    }
  }, [localParticipant, task, isBreak, rank, isMirrored, isCamOff]);

  return null;
}
