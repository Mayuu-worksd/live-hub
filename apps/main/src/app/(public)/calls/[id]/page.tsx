'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';
import CallAudioInjector from '@/components/studio/CallAudioInjector';
import { useRouter } from 'next/navigation';
import { PhoneOff, Loader2 } from 'lucide-react';

export default function CallRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: callId } = use(params);
  const { user } = useAuthStore();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchSession = async () => {
      try {
        console.log('[CallRoomPage] Fetching session for callId:', callId);
        const { data, error: dbError } = await supabase.from('call_sessions').select('*').eq('id', callId).single();
        if (dbError) {
          console.error('[CallRoomPage] Supabase error:', dbError);
          setError(`Call not found: ${dbError.message}`);
          return;
        }
        if (!data) {
          setError('Call not found (empty data)');
          return;
        }
        console.log('[CallRoomPage] Session loaded:', data);
        setSession(data);

        if (data.status === 'active' && data.livekit_room_name) {
          // Since generating token needs server secret, we hit a new GET or POST to get token for existing active call
          // But the API currently doesn't have a GET for just token. We can add one or use standard initiate/accept.
          // If caller joins active, we need a token.
          // For simplicity, let's just make the user join via Accept action or add a generic getToken API.
        }
      } catch (err: any) {
        console.error('[CallRoomPage] Exception in fetchSession:', err);
        setError(`System error: ${err.message || err}`);
      }
    };

    fetchSession();

    const channel = supabase
      .channel(`call:${callId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_sessions', filter: `id=eq.${callId}` }, (payload) => {
        setSession(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, callId]);

  const handleAccept = async () => {
    const res = await fetch('/api/calls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', sessionId: callId })
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.calleeToken);
    } else {
      setError(data.error);
    }
  };

  const handleEnd = async () => {
    await fetch('/api/calls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'end', sessionId: callId })
    });
    router.push('/calls');
  };

  const handleDecline = async () => {
    await fetch('/api/calls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline', sessionId: callId })
    });
    router.push('/calls');
  };

  // Fetch LiveKit token for either caller or callee when session is active
  useEffect(() => {
    let active = true;

    if (session?.status === 'active' && !token && user) {
      if (session.caller_id === user.id || session.callee_id === user.id) {
        fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName: session.livekit_room_name, userId: user.id, role: 'host' })
        })
        .then(async r => {
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || 'Failed to fetch LiveKit token');
          return d;
        })
        .then(d => {
          if (active) {
            if (d.token) {
              setToken(d.token);
            } else {
              setError('No token returned from server');
            }
          }
        })
        .catch(err => {
          if (active) {
            console.error('[CallRoomPage] Error fetching livekit token:', err);
            setError(err.message || 'Error fetching LiveKit token');
          }
        });
      }
    }

    return () => {
      active = false;
    };
  }, [session, user, token]);


  if (error) return <div className="h-[calc(100vh-4rem)] flex items-center justify-center text-rose">{error}</div>;
  if (!user || !session) return <div className="h-[calc(100vh-4rem)] flex items-center justify-center"><Loader2 className="animate-spin text-violet" /></div>;

  if (session.status === 'ended' || session.status === 'missed') {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center px-4">
        <h2 className="text-xl font-semibold text-white mb-2">Call Ended</h2>
        <p className="text-zinc-500 mb-6">Duration: {Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at || session.created_at).getTime()) / 60000)} mins</p>
        <button onClick={() => router.push('/calls')} className="px-6 py-2 rounded-full bg-white/10 text-white">Back to Calls</button>
      </div>
    );
  }

  if (session.status === 'ringing') {
    const isCaller = session.caller_id === user.id;
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-[#09090b]">
        <div className="h-32 w-32 rounded-full bg-zinc-800 animate-pulse mb-8" />
        <h2 className="text-2xl font-bold text-white mb-2">{isCaller ? 'Calling...' : 'Incoming Call'}</h2>
        
        {isCaller ? (
          <button onClick={handleEnd} className="mt-8 h-16 w-16 rounded-full bg-rose flex items-center justify-center text-white hover:bg-rose/90 transition-colors shadow-lg shadow-rose/20">
            <PhoneOff className="h-6 w-6" />
          </button>
        ) : (
          <div className="flex gap-8 mt-8">
            <button onClick={handleDecline} className="h-16 w-16 rounded-full bg-rose flex items-center justify-center text-white hover:bg-rose/90 transition-colors">
              <PhoneOff className="h-6 w-6" />
            </button>
            <button onClick={handleAccept} className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-400 transition-colors animate-bounce">
              <PhoneOff className="h-6 w-6 rotate-[135deg]" />
            </button>
          </div>
        )}
      </div>
    );
  }

  if (session.status === 'active' && token) {
    return (
      <div className="h-[calc(100vh-4rem)] relative bg-black">
        <LiveKitRoom
          video={session.call_type === 'video'}
          audio={false} // Managed by CallAudioInjector for Seed-VC
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          data-lk-theme="default"
          onDisconnected={handleEnd}
          className="h-full relative"
        >
          <VideoConference />
          <CallAudioInjector roomName={session.livekit_room_name} />
        </LiveKitRoom>
      </div>
    );
  }

  return <div className="h-[calc(100vh-4rem)] flex items-center justify-center"><Loader2 className="animate-spin text-violet" /></div>;
}
