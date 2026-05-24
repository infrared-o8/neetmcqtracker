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
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RoomSidebar } from '../components/studyroom/RoomSidebar';
import { ParticipantTile } from '../components/studyroom/ParticipantTile';
import { useProfileStore } from '../store/useProfileStore';
import { useLiveRoomStore } from '../store/useLiveRoomStore';
import { useTrackerStore } from '../store/useTrackerStore';
import { apiFetch } from '../utils/api';

export default function StudyRoomPage() {
  const [token, setToken] = useState(null);
  const [lkUrl, setLkUrl] = useState(null);
  const [error, setError] = useState(null);
  const displayName = useProfileStore((s) => s.displayName) || 'Aspirant';
  const serverUrl = useTrackerStore((s) => s.preferences.serverUrl);
  const { pinnedUsers } = useLiveRoomStore();

  useEffect(() => {
    (async () => {
      try {
        const resp = await apiFetch(serverUrl, '/api/livekit/token', {
          method: 'POST',
          body: JSON.stringify({ playerName: displayName }),
        });
        
        if (!resp.ok) {
          const errorData = await resp.json().catch(() => ({ error: resp.statusText }));
          throw new Error(errorData.error || `Server returned ${resp.status}`);
        }

        const data = await resp.json();
        setToken(data.token);
        setLkUrl(data.serverUrl);
      } catch (e) {
        console.error('Failed to fetch LiveKit token:', e);
        setError(e.message);
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
    <LiveKitRoom
      video={true}
      audio={false} // Globally muted by default
      token={token}
      serverUrl={lkUrl}
      onConnected={() => console.log('Connected to LiveKit')}
      onDisconnected={() => setToken(null)}
      className="flex h-full flex-col overflow-hidden bg-zinc-950/20"
    >
      <div className="flex h-full flex-1 overflow-hidden">
        {/* Left Panel: Sidebar Stack */}
        <aside className="hidden w-[320px] shrink-0 flex-col border-r border-white/5 bg-zinc-900/20 backdrop-blur-md lg:flex">
          <div className="flex-1 overflow-y-auto">
            <RoomSidebarContent />
          </div>
        </aside>

        {/* Main Panel: Fluid Grid */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <StudyGrid />
        </main>
      </div>

      <RoomAudioRenderer />
    </LiveKitRoom>
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

  const { pinnedUsers } = useLiveRoomStore();

  // Sort tracks: Pinned users first, then local participant, then others
  const sortedTracks = [...tracks].sort((a, b) => {
    const aIdentity = a.participant.identity;
    const bIdentity = b.participant.identity;
    
    if (pinnedUsers.includes(aIdentity) && !pinnedUsers.includes(bIdentity)) return -1;
    if (!pinnedUsers.includes(aIdentity) && pinnedUsers.includes(bIdentity)) return 1;
    
    if (a.participant.isLocal && !b.participant.isLocal) return -1;
    if (!a.participant.isLocal && b.participant.isLocal) return 1;
    
    return 0;
  });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
