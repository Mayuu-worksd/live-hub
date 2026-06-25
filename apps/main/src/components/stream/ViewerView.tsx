'use client';

import { useRemoteParticipant, useTracks, VideoTrack, RoomAudioRenderer, useLocalParticipant } from '@livekit/components-react';
import ChatPanel from './ChatPanel';
import GiftOverlay from './GiftOverlay';
import GiftPanel from './GiftPanel';
import TopGifters from './features/TopGifters';
import { Track } from 'livekit-client';
import { Gift, Heart, Users, Share2, Video as VideoIcon, Mic, MicOff, Camera, CameraOff, Loader2, MessageCircle, MoreHorizontal } from 'lucide-react';
import type { Stream } from '@/types/stream';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useStreamStore } from '@/stores/useStreamStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { cn } from '@/lib/utils/cn';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import VoiceSettingsModal from '../studio/VoiceSettingsModal';
import { Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ViewerView({ stream }: { stream: Stream }) {
  const hostParticipant = useRemoteParticipant(stream.host_id);
  const tracks = useTracks([Track.Source.Camera]);
  
  const { localParticipant } = useLocalParticipant();
  const canPublish = localParticipant.permissions?.canPublish;
  const isVideoEnabled = localParticipant.isCameraEnabled;
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  
  const { settings, updateSettings, processedTrack, isProcessing } = useVoiceEngine(stream.livekit_room_name, isAudioEnabled);

  useEffect(() => {
    if (processedTrack && localParticipant && canPublish) {
      localParticipant.publishTrack(processedTrack);
      return () => {
        localParticipant.unpublishTrack(processedTrack);
      };
    }
  }, [processedTrack, localParticipant, canPublish]);

  const { user } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const [following, setFollowing] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [cohostStatus, setCohostStatus] = useState<'idle' | 'pending' | 'accepted'>('idle');
  const { viewerCount } = useStreamStore();
  const [likes, setLikes] = useState(0);

  const guard = (action: string, fn: () => void) => {
    if (!user) {
      openModal(action);
    } else {
      fn();
    }
  };

  const handleFollow = () => {
    guard('follow creators', () => {
      setFollowing(!following);
      toast.success(following ? 'Unfollowed' : `Following ${stream.host?.username}`, { icon: '✨' });
    });
  };

  const handleLike = () => {
    guard('like streams', () => {
      setLikes(prev => prev + 1);
      // In a real app, this would trigger floating hearts animation and websocket event
    });
  };

  const requestCohost = async () => {
    guard('request to co-host', async () => {
      try {
      setCohostStatus('pending');
      const res = await fetch(`/api/streams/${stream.id}/cohost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request' })
      });
      if (!res.ok) throw new Error('Failed to request');
      toast.success('Co-host request sent!');
    } catch (err) {
      toast.error('Failed to request co-host');
      setCohostStatus('idle');
    }
    });
  };

  const toggleVideo = () => localParticipant.setCameraEnabled(!isVideoEnabled);
  const toggleAudio = () => setIsAudioEnabled(!isAudioEnabled);

  const gridClass = tracks.length > 1 ? "grid grid-cols-2 gap-2 p-2 h-full w-full" : "flex-1 h-full w-full flex flex-col";

  // Shared Video Canvas Component
  const VideoCanvas = () => (
    <div className="absolute inset-0 z-0 bg-[#09090b]">
      <div className={cn("h-full w-full", gridClass)}>
        {tracks.length > 0 ? (
          tracks.map((trackRef) => (
            <div key={trackRef.participant.identity} className="relative overflow-hidden h-full w-full group">
              <VideoTrack trackRef={trackRef} className="h-full w-full object-cover" />
              {tracks.length > 1 && (
                <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {trackRef.participant.identity === stream.host_id ? 'Host' : trackRef.participant.identity === localParticipant.identity ? 'You' : 'Co-host'}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center flex-col gap-6 z-10 h-full">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-4xl shadow-2xl relative z-10">
                🎥
              </div>
              <div className="absolute inset-0 bg-violet-500/20 rounded-full animate-ping z-0" />
            </div>
            <p className="text-zinc-400 text-sm font-medium tracking-wide">
              {hostParticipant ? 'Waiting for video feed...' : 'Host is offline or connecting...'}
            </p>
          </div>
        )}
      </div>
      <GiftOverlay streamId={stream.id} />
    </div>
  );

  return (
    <div className="flex h-full w-full bg-black overflow-hidden font-sans relative">
      <RoomAudioRenderer />
      
      {/* DESKTOP LAYOUT (lg+) */}
      <div className="hidden lg:flex w-full h-full relative z-10">
        
        {/* Left Sidebar */}
        <div className="w-[280px] bg-[#0A0A0A] border-r border-white/5 flex flex-col p-6 z-20 shrink-0">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet to-fuchsia-500 p-1 mb-4 shadow-xl shadow-fuchsia-500/20">
              <div className="w-full h-full bg-black rounded-full overflow-hidden border-4 border-black">
                {stream.host?.profile?.avatar_url ? (
                  <img src={stream.host.profile.avatar_url} alt="Host" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-white bg-zinc-800">
                    {stream.host?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight mb-1">{stream.host?.profile?.display_name || stream.host?.username}</h2>
            <p className="text-xs text-zinc-400 font-medium mb-4">@{stream.host?.username}</p>
            
            <button 
              onClick={handleFollow}
              className={cn(
                "w-full py-2.5 rounded-xl text-sm font-bold transition-all",
                following ? "bg-white/10 text-white" : "bg-violet text-white hover:bg-violet-light shadow-lg shadow-violet/20"
              )}
            >
              {following ? 'Following' : 'Follow'}
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">About Stream</h3>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <h4 className="text-sm font-bold text-white mb-2 leading-snug">{stream.title}</h4>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold text-zinc-300">{stream.category}</span>
                <span className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded-md text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <TopGifters streamId={stream.id} />
          </div>
        </div>

        {/* Center Main Video */}
        <div className="flex-1 relative flex flex-col z-10">
          <div className="flex-1 relative m-4 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
            <VideoCanvas />
            {/* Viewers Badge */}
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <span className="text-xs font-bold text-white">{viewerCount}</span>
            </div>
          </div>

          {/* Desktop Bottom Action Bar */}
          <div className="h-20 px-8 flex items-center justify-between shrink-0">
            {canPublish ? (
              <div className="flex items-center gap-3">
                <button onClick={() => setShowVoiceStudio(true)} className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/5">
                  <Settings2 className="h-4 w-4" />
                </button>
                <button onClick={toggleAudio} className={cn('h-10 w-10 rounded-xl flex items-center justify-center transition-colors', isAudioEnabled ? 'bg-white/5 hover:bg-white/10 text-white border border-white/5' : 'bg-rose-500 text-white')}>
                  {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </button>
                <button onClick={toggleVideo} className={cn('h-10 w-10 rounded-xl flex items-center justify-center transition-colors', isVideoEnabled ? 'bg-white/5 hover:bg-white/10 text-white border border-white/5' : 'bg-rose-500 text-white')}>
                  {isVideoEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={requestCohost}
                  disabled={cohostStatus === 'pending'}
                  className="px-4 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center gap-2 text-sm font-semibold text-white transition-colors disabled:opacity-50"
                >
                  {cohostStatus === 'pending' ? <Loader2 className="w-4 h-4 animate-spin text-violet-400" /> : <VideoIcon className="w-4 h-4 text-violet-400" />}
                  {cohostStatus === 'pending' ? 'Requesting...' : 'Request Co-host'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button onClick={() => toast('Link copied!', { icon: '🔗' })} className="h-10 w-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white transition-colors">
                <Share2 className="h-4 w-4" />
              </button>
              <button onClick={() => guard('send gifts', () => setShowGifts(true))} className="px-6 h-10 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 flex items-center gap-2 text-sm font-bold text-white hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Gift className="w-4 h-4" /> Send Gift
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar (Chat) */}
        <div className="w-[340px] border-l border-white/5 z-20 shrink-0 bg-[#0A0A0A]">
          <ChatPanel streamId={stream.id} isHost={false} />
        </div>

        {/* Desktop Gift Modal Overlays */}
        {showGifts && <GiftPanel streamId={stream.id} receiverId={stream.host_id} onClose={() => setShowGifts(false)} />}
      </div>


      {/* MOBILE LAYOUT (< lg) */}
      <div className="flex lg:hidden w-full h-full relative">
        <VideoCanvas />
        
        {/* Mobile Top Overlay */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 pointer-events-none flex flex-col gap-4">
          <div className="flex items-center justify-between pointer-events-auto">
            {/* Host Badge */}
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full p-1 pr-3 border border-white/10 shadow-lg">
              <div className="h-9 w-9 rounded-full bg-zinc-800 overflow-hidden">
                {stream.host?.profile?.avatar_url ? (
                  <img src={stream.host.profile.avatar_url} alt="Host" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-violet to-fuchsia-500">
                    {stream.host?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-white leading-tight">{stream.host?.username}</span>
                <span className="text-[9px] text-zinc-300 font-medium">1.2k diamonds</span>
              </div>
              <button onClick={handleFollow} className={cn("ml-2 h-7 w-7 rounded-full flex items-center justify-center transition-all", following ? "bg-white/20" : "bg-rose-500")}>
                {following ? <Heart className="w-3.5 h-3.5 text-white fill-white" /> : <Heart className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>

            {/* Viewers & Top Gifters */}
            <div className="flex items-center gap-2">
              <TopGifters streamId={stream.id} />
              <div className="h-9 px-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-300" />
                <span className="text-xs font-bold text-white">{viewerCount}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <span className="px-2 py-0.5 rounded bg-black/40 backdrop-blur-md border border-white/10 text-[10px] font-bold text-zinc-300 uppercase">{stream.category}</span>
          </div>
        </div>

        {/* Mobile Middle Overlay (Floating Chat) */}
        <div className="absolute bottom-20 left-0 right-16 top-32 z-20 pointer-events-none flex items-end p-4">
          <div className="w-full h-64 pointer-events-auto mask-image-to-top">
             <ChatPanel streamId={stream.id} isHost={false} isOverlay={true} />
          </div>
        </div>

        {/* Mobile Right Sidebar Actions */}
        <div className="absolute bottom-24 right-2 z-20 flex flex-col gap-4 pointer-events-auto">
          {!canPublish && (
            <button onClick={requestCohost} className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg">
              <VideoIcon className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => toast('Link copied!', { icon: '🔗' })} className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors shadow-lg">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="relative group cursor-pointer" onClick={handleLike}>
            <button className="h-12 w-12 rounded-full bg-rose-500 flex items-center justify-center text-white transition-transform active:scale-90 shadow-[0_0_15px_rgba(244,63,94,0.5)]">
              <Heart className="w-6 h-6 fill-white" />
            </button>
            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{likes}</span>
          </div>
          <button onClick={() => guard('send gifts', () => setShowGifts(true))} className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white transition-transform active:scale-90 shadow-[0_0_20px_rgba(217,70,239,0.5)]">
            <Gift className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe bg-gradient-to-t from-black/80 to-transparent z-30 pointer-events-auto flex gap-3 items-center">
          <div 
            onClick={() => setShowMobileChat(true)}
            className="flex-1 h-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 flex items-center px-4 text-sm font-medium text-zinc-400 cursor-text shadow-lg"
          >
            Chat...
          </div>
          {canPublish && (
             <div className="flex gap-2">
               <button onClick={toggleAudio} className={cn('h-11 w-11 rounded-full flex items-center justify-center transition-colors', isAudioEnabled ? 'bg-black/50 backdrop-blur-xl border border-white/20 text-white' : 'bg-rose-500 text-white')}>
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
               </button>
               <button onClick={() => setShowVoiceStudio(true)} className="h-11 w-11 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
                 <Settings2 className="w-4 h-4" />
               </button>
             </div>
          )}
        </div>

        {/* Mobile Chat Full Sheet */}
        <AnimatePresence>
          {showMobileChat && (
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 bg-black/95 flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/10 bg-black">
                <span className="text-sm font-bold text-white">Live Chat</span>
                <button onClick={() => setShowMobileChat(false)} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel streamId={stream.id} isHost={false} isOverlay={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {showGifts && <GiftPanel streamId={stream.id} receiverId={stream.host_id} onClose={() => setShowGifts(false)} />}
      </div>

      <VoiceSettingsModal isOpen={showVoiceStudio} onClose={() => setShowVoiceStudio(false)} settings={settings} onUpdate={updateSettings} isProcessing={isProcessing} />
    </div>
  );
}
