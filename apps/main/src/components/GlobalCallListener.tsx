'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { PhoneIncoming, PhoneOff, Phone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function GlobalCallListener() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    // Check for existing ringing calls
    const checkCalls = async () => {
      const { data } = await supabase
        .from('call_sessions')
        .select('*, caller:users!caller_id(id, username, profile:profiles(display_name, avatar_url))')
        .eq('callee_id', user.id)
        .eq('status', 'ringing')
        .single();
      
      if (data) setIncomingCall(data);
    };

    checkCalls();

    const channel = supabase
      .channel(`incoming_calls:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_sessions', filter: `callee_id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new && payload.new.status === 'ringing') {
            // Need to fetch caller details
            supabase.from('users').select('id, username, profile:profiles(display_name, avatar_url)').eq('id', payload.new.caller_id).single()
              .then(({ data: caller }) => {
                setIncomingCall({ ...payload.new, caller });
              });
          } else if (payload.new && payload.new.status !== 'ringing') {
            setIncomingCall((prev: any) => prev?.id === payload.new.id ? null : prev);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleAccept = () => {
    if (!incomingCall) return;
    router.push(`/calls/${incomingCall.id}`);
    setIncomingCall(null);
  };

  const handleDecline = async () => {
    if (!incomingCall) return;
    await fetch('/api/calls', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'decline', sessionId: incomingCall.id })
    });
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4"
      >
        <div className="bg-[#111113]/95 backdrop-blur-xl border border-white/10 shadow-2xl shadow-emerald-500/10 rounded-3xl p-5 flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="h-16 w-16 rounded-full overflow-hidden bg-zinc-800 shrink-0 relative z-10 border-2 border-emerald-500">
                {incomingCall.caller?.profile?.avatar_url ? (
                  <img src={incomingCall.caller.profile.avatar_url} className="h-full w-full object-cover" alt="" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xl font-bold text-white">
                    {incomingCall.caller?.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping z-0" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-bold text-lg">{incomingCall.caller?.profile?.display_name || incomingCall.caller?.username}</h3>
              <p className="text-emerald-400 text-sm flex items-center justify-center gap-1">
                <PhoneIncoming className="h-3.5 w-3.5 animate-pulse" /> Incoming {incomingCall.call_type} call...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 w-full justify-center">
            <button onClick={handleDecline} className="h-12 w-12 rounded-full bg-rose flex items-center justify-center text-white hover:bg-rose/90 transition-colors shadow-lg shadow-rose/20 hover:scale-105 active:scale-95">
              <PhoneOff className="h-5 w-5" />
            </button>
            <button onClick={handleAccept} className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20 animate-bounce hover:scale-105 active:scale-95">
              <Phone className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
