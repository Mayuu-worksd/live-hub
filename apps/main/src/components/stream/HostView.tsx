'use client';

import { useTracks, VideoTrack, useLocalParticipant, RoomAudioRenderer } from '@livekit/components-react';
import ChatPanel from './ChatPanel';
import GiftOverlay from './GiftOverlay';
import AnalyticsWidget from './features/AnalyticsWidget';
import { Track } from 'livekit-client';
import { Camera, CameraOff, Mic, MicOff, PhoneOff, Users, UserPlus, X, Check, Settings2, Play, Pause, AlertCircle } from 'lucide-react';
import type { Stream } from '@/types/stream';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils/cn';
import { useStreamStore } from '@/stores/useStreamStore';
import { supabase } from '@/lib/supabase/client';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import VoiceSettingsModal from '../studio/VoiceSettingsModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function HostView({ stream }: { stream: Stream }) {
  const router = useRouter();
  const { localParticipant } = useLocalParticipant();
  const [ending, setEnding] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const { viewerCount } = useStreamStore();
  const [uptime, setUptime] = useState('00:00:00');

  const tracks = useTracks([Track.Source.Camera]);

  const isVideoEnabled = localParticipant.isCameraEnabled;
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const { settings, updateSettings, processedTrack, isProcessing } = useVoiceEngine(stream.livekit_room_name, isAudioEnabled);

  useEffect(() => {
    if (processedTrack && localParticipant) {
      localParticipant.publishTrack(processedTrack);
      return () => {
        localParticipant.unpublishTrack(processedTrack);
      };
    }
  }, [processedTrack, localParticipant]);

  useEffect(() => {
    // Simple uptime timer
    const start = new Date(stream.created_at).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = now - start;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [stream.created_at]);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('cohost_requests')
        .select('*, user:users!user_id(id, username, profile:profiles(display_name, avatar_url))')
        .eq('stream_id', stream.id)
        .eq('status', 'pending');
      if (data) setRequests(data);
    };

    fetchRequests();

    const channel = supabase
      .channel(`cohost_requests_host:${stream.id}-${Math.random()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cohost_requests', filter: `stream_id=eq.${stream.id}` }, () => fetchRequests())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [stream.id]);

  const handleRequestAction = async (userId: string, action: 'accept' | 'reject') => {
    try {
      const res = await fetch(`/api/streams/${stream.id}/cohost`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId })
      });
      if (!res.ok) throw new Error('Failed action');
      toast.success(action === 'accept' ? 'Co-host accepted!' : 'Request rejected');
    } catch (err: any) {
      toast.error('Failed to process request');
    }
  };

  const toggleVideo = async () => await localParticipant.setCameraEnabled(!isVideoEnabled);
  const toggleAudio = async () => setIsAudioEnabled(!isAudioEnabled);
  const togglePause = () => setIsPaused(!isPaused);

  const endStream = async () => {
    if (!confirm('Are you sure you want to end the stream?')) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/streams/${stream.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'end' }) });
      if (!res.ok) throw new Error('Failed to end stream');
      toast.success('Stream ended');
      router.push('/home');
    } catch (err: any) {
      toast.error(err.message);
      setEnding(false);
    }
  };

  const gridClass = tracks.length > 1 ? "grid grid-cols-2 gap-2 p-2 h-full w-full" : "flex-1 h-full w-full flex flex-col";

  return (
    <div className="flex h-full w-full bg-[#050505] overflow-hidden text-white font-sans">
      <RoomAudioRenderer />
      
      {/* LEFT SIDEBAR: Stream Controls & Moderation */}
      <div className="w-80 bg-[#0A0A0A] border-r border-white/5 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-bold tracking-tight mb-1">Creator Studio</h2>
          <p className="text-xs text-zinc-400 font-medium">Manage your broadcast</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Stream Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Stream Info</h3>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Title</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium">{stream.title}</div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Category</label>
              <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium">{stream.category}</div>
            </div>
          </div>

          {/* AV Controls Sidebar */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Studio Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleVideo} className={cn("flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2", isVideoEnabled ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-rose-500/20 border-rose-500/50 text-rose-400")}>
                {isVideoEnabled ? <Camera className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
                <span className="text-xs font-bold">{isVideoEnabled ? 'Camera On' : 'Camera Off'}</span>
              </button>
              <button onClick={toggleAudio} className={cn("flex flex-col items-center justify-center p-4 rounded-xl border transition-all gap-2", isAudioEnabled ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-rose-500/20 border-rose-500/50 text-rose-400")}>
                {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                <span className="text-xs font-bold">{isAudioEnabled ? 'Mic On' : 'Mic Off'}</span>
              </button>
            </div>
            <button onClick={() => setShowVoiceStudio(true)} className="w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 hover:bg-violet-500/30 transition-all">
              <div className="flex items-center gap-3">
                <Settings2 className="h-5 w-5 text-fuchsia-400" />
                <span className="text-sm font-bold text-white">Voice Studio AI</span>
              </div>
              <div className={cn("w-2 h-2 rounded-full", isProcessing ? "bg-emerald-400 animate-pulse" : "bg-zinc-500")} />
            </button>
          </div>

          {/* Co-host Requests */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex justify-between items-center">
              Co-host Requests
              {requests.length > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>}
            </h3>
            <div className="space-y-2">
              {requests.length === 0 ? (
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center text-xs text-zinc-500 font-medium">No pending requests</div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img src={req.user.profile?.avatar_url || `https://ui-avatars.com/api/?name=${req.user.username}`} className="h-8 w-8 rounded-full object-cover shrink-0" alt="" />
                      <span className="text-xs font-semibold truncate">{req.user.profile?.display_name || req.user.username}</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => handleRequestAction(req.user_id, 'accept')} className="h-7 w-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => handleRequestAction(req.user_id, 'reject')} className="h-7 w-7 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CENTER: Main Broadcast Canvas */}
      <div className="flex-1 flex flex-col relative bg-[#09090B]">
        {/* Top Info Bar */}
        <div className="h-16 px-6 border-b border-white/5 flex items-center justify-between bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-rose-500/20 text-rose-500 border border-rose-500/50 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE
            </span>
            <span className="text-sm font-semibold text-zinc-300 font-mono">{uptime}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-md border border-white/10 text-xs font-bold text-white">
              <AlertCircle className="w-3.5 h-3.5 text-emerald-400" /> Excellent Connection
            </div>
          </div>
        </div>

        {/* Video Canvas Container */}
        <div className="flex-1 p-6 relative">
          <div className="w-full h-full relative rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
            <GiftOverlay streamId={stream.id} />
            <div className={cn("relative z-0", gridClass)}>
              {tracks.length > 0 ? (
                tracks.map((trackRef) => (
                  <div key={trackRef.participant.identity} className="relative rounded-xl overflow-hidden bg-zinc-900 border border-white/10 h-full w-full group">
                    <VideoTrack trackRef={trackRef} className={cn("h-full w-full object-cover", isPaused && "blur-xl scale-110 opacity-50")} />
                    <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                      {trackRef.participant.identity === stream.host_id ? 'Main Camera' : 'Co-host Camera'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center flex-col gap-4 z-10 h-full">
                  <CameraOff className="h-12 w-12 text-zinc-600 mb-2" />
                  <p className="text-zinc-500 text-sm font-medium">Camera is disabled</p>
                </div>
              )}
              {isPaused && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                  <Pause className="w-16 h-16 text-white/50 mb-4" />
                  <h2 className="text-2xl font-bold text-white">Stream Paused</h2>
                  <p className="text-zinc-400 text-sm mt-2">Viewers are seeing a pause screen</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Primary Controls */}
        <div className="h-24 px-8 border-t border-white/5 bg-[#0A0A0A] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePause}
              className={cn("px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all", isPaused ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20" : "bg-white/10 text-white hover:bg-white/20")}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume Stream' : 'Pause Stream'}
            </button>
          </div>
          
          <button
            onClick={endStream}
            disabled={ending}
            className="px-8 py-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)] disabled:opacity-50 flex items-center gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            {ending ? 'Ending Broadcast...' : 'End Broadcast'}
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Analytics & Chat */}
      <div className="w-[360px] bg-[#0A0A0A] border-l border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <AnalyticsWidget streamId={stream.id} />
        </div>
        <div className="flex-1 min-h-0 relative">
          <ChatPanel streamId={stream.id} isHost={true} />
        </div>
      </div>

      <VoiceSettingsModal isOpen={showVoiceStudio} onClose={() => setShowVoiceStudio(false)} settings={settings} onUpdate={updateSettings} isProcessing={isProcessing} />
    </div>
  );
}
