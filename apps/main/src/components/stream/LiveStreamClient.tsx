'use client';

import { useEffect, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStreamStore } from '@/stores/useStreamStore';
import { supabase } from '@/lib/supabase/client';
import type { Stream } from '@/types/stream';
import HostView from './HostView';
import ViewerView from './ViewerView';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface LiveStreamClientProps {
  stream: Stream;
}

export default function LiveStreamClient({ stream }: LiveStreamClientProps) {
  const { user } = useAuthStore();
  const { setStream, setViewerCount } = useStreamStore();
  const [token, setToken] = useState('');
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');

  const isHost = user?.id === stream.host_id;

  // Set initial stream state
  useEffect(() => {
    setStream(stream);
    setViewerCount(stream.viewer_count);
  }, [stream, setStream, setViewerCount]);

  // Fetch LiveKit Token
  useEffect(() => {
    if (!user) return;

    let active = true;

    const fetchToken = async () => {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId: stream.id, userId: user.id, role: isHost ? 'host' : 'viewer' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get token');
        if (active) {
          setToken(data.token);
          setRoomName(data.roomName);
        }
      } catch (err: any) {
        if (active) {
          setError(err.message);
          toast.error(err.message);
        }
      }
    };

    fetchToken();

    // Listen to cohost request updates to refresh token if promoted
    const cohostChannel = supabase
      .channel(`cohost_updates:${stream.id}:${user.id}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'cohost_requests', filter: `stream_id=eq.${stream.id}` },
        (payload) => {
          if (payload.new.user_id === user.id && payload.new.status === 'accepted') {
            fetchToken();
            toast.success('Your co-host request was accepted!');
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(cohostChannel);
    };
  }, [user, stream.id, isHost]);

  // Realtime Viewer Tracking & Postgres changes subscription
  useEffect(() => {
    if (!token) return;

    // Send Join event
    fetch(`/api/streams/${stream.id}/viewers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join' })
    });

    // Listen to database updates on viewer count
    const channel = supabase
      .channel(`stream_updates:${stream.id}-${Math.random()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'streams', filter: `id=eq.${stream.id}` },
        (payload) => {
          setViewerCount(payload.new.viewer_count);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Send Leave event on unmount
      fetch(`/api/streams/${stream.id}/viewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'leave' }),
        keepalive: true
      });
    };
  }, [token, stream.id, setViewerCount]);

  if (stream.status === 'ended') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-zinc-500 text-sm">This stream has ended.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-zinc-500 text-sm">Please sign in to view this stream.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p className="text-rose text-sm">Error: {error}</p>
      </div>
    );
  }

  if (!token || !roomName) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] flex-col gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet" />
        <p className="text-zinc-500 text-sm">Connecting to stream...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={isHost}
      audio={false} // Managed manually by VoiceEngine in HostView/ViewerView
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      className="h-[calc(100vh-4rem)] bg-[#09090b] relative"
    >
      {isHost ? <HostView stream={stream} /> : <ViewerView stream={stream} />}
    </LiveKitRoom>
  );
}
