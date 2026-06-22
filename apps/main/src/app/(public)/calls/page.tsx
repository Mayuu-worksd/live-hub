'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { motion } from 'framer-motion';
import { Phone, Video, PhoneIncoming, PhoneOutgoing, PhoneMissed } from 'lucide-react';
import Link from 'next/link';

export default function CallsPage() {
  const { user } = useAuthStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      const { data } = await supabase
        .from('call_sessions')
        .select(`
          *,
          caller:users!caller_id(id, username, profile:profiles(display_name, avatar_url)),
          callee:users!callee_id(id, username, profile:profiles(display_name, avatar_url))
        `)
        .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data) setSessions(data);
      setLoading(false);
    };

    fetchSessions();

    const channel = supabase
      .channel('calls_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_sessions' }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user) return <div className="p-8 text-center text-zinc-500">Sign in to view calls</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 min-h-[calc(100vh-4rem)]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Phone className="h-6 w-6 text-violet" /> Calls
        </h1>
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10">
          <p className="text-zinc-500">No calls yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const isCaller = s.caller_id === user.id;
            const other = isCaller ? s.callee : s.caller;
            
            let Icon = PhoneOutgoing;
            let iconColor = 'text-zinc-400';
            if (!isCaller) {
              Icon = PhoneIncoming;
              if (s.status === 'missed') { Icon = PhoneMissed; iconColor = 'text-rose'; }
            } else if (s.status === 'missed') {
              Icon = PhoneMissed; iconColor = 'text-rose';
            }

            return (
              <div key={s.id} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 transition-all rounded-2xl border border-white/10">
                <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                  {other?.profile?.avatar_url ? (
                    <img src={other.profile.avatar_url} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <span className="text-lg font-bold text-white">{other?.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{other?.profile?.display_name || other?.username}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                    <Icon className={`h-3 w-3 ${iconColor}`} />
                    <span>{new Date(s.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {s.status === 'active' || s.status === 'ringing' ? (
                    <Link href={`/calls/${s.id}`} className="px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold text-sm">
                      {s.status === 'ringing' && !isCaller ? 'Answer' : 'Join'}
                    </Link>
                  ) : (
                    <span className="text-xs text-zinc-500 capitalize">{s.status}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
