'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';

interface Sub {
  id: string;
  tier: string;
  status: string;
  started_at: string;
  subscriber: { username: string; email: string } | null;
}

const TIER_COLOR: Record<string, string> = {
  bronze: 'text-amber-600',
  silver: 'text-zinc-300',
  gold: 'text-gold',
};

export default function SubscribersPage() {
  const { user } = useAuthStore();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('subscriptions')
      .select('id, tier, status, started_at, subscriber:users!subscriber_id(username, email)')
      .eq('creator_id', user.id)
      .order('started_at', { ascending: false })
      .then(({ data }) => { setSubs((data ?? []) as unknown as Sub[]); setLoading(false); });
  }, [user]);

  const active = subs.filter((s) => s.status === 'active').length;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Subscribers</h1>
        <p className="text-sm text-zinc-500 mt-1">{active} active subscriber{active !== 1 ? 's' : ''}</p>
      </motion.div>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-16" />)}</div>
      ) : subs.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Users className="h-10 w-10 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">No subscribers yet</p>
          <p className="text-zinc-600 text-sm mt-1">Keep streaming to grow your audience</p>
        </div>
      ) : (
        <div className="space-y-2">
          {subs.map((s) => (
            <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass rounded-xl px-5 py-3.5 flex items-center gap-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet/60 to-cyan/60 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {s.subscriber?.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">@{s.subscriber?.username}</p>
                <p className="text-xs text-zinc-500">{s.subscriber?.email}</p>
              </div>
              <span className={cn('text-xs font-semibold capitalize', TIER_COLOR[s.tier] ?? 'text-zinc-400')}>
                {s.tier}
              </span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                s.status === 'active' ? 'bg-emerald/10 text-emerald' : 'bg-zinc-700 text-zinc-400')}>
                {s.status}
              </span>
              <p className="text-xs text-zinc-500 hidden sm:block">
                since {new Date(s.started_at).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
