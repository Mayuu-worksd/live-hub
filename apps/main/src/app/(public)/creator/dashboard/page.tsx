'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Diamond, Radio, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';

interface Stats { totalDiamonds: number; totalSubscribers: number; streamCount: number; totalHours: number }
interface RecentStream { id: string; title: string; viewer_count: number; total_gifts_received: number; started_at: string; ended_at: string | null }
interface TopGifter { sender_id: string; username: string; total: number }

export default function CreatorDashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentStreams, setRecentStreams] = useState<RecentStream[]>([]);
  const [topGifters, setTopGifters] = useState<TopGifter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [walletRes, streamsRes, giftersRes, subsRes] = await Promise.all([
        supabase.from('wallets').select('diamond_balance').eq('user_id', user.id).single(),
        supabase.from('streams').select('id, title, viewer_count, total_gifts_received, started_at, ended_at').eq('host_id', user.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('stream_gifts').select('sender_id, coins_spent, sender:users!sender_id(username)').eq('receiver_id', user.id).limit(20),
        supabase.from('subscriptions').select('id').eq('creator_id', user.id).eq('status', 'active'),
      ]);
      const streams = streamsRes.data ?? [];
      const totalHours = streams.reduce((acc, s) => {
        if (s.started_at && s.ended_at) acc += (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 3600000;
        return acc;
      }, 0);
      setStats({ totalDiamonds: walletRes.data?.diamond_balance ?? 0, totalSubscribers: subsRes.data?.length ?? 0, streamCount: streams.length, totalHours: Math.round(totalHours) });
      setRecentStreams(streams as RecentStream[]);
      const gifterMap: Record<string, { username: string; total: number }> = {};
      for (const g of giftersRes.data ?? []) {
        if (!gifterMap[g.sender_id]) gifterMap[g.sender_id] = { username: (g.sender as { username?: string })?.username ?? 'unknown', total: 0 };
        gifterMap[g.sender_id].total += g.coins_spent;
      }
      setTopGifters(Object.entries(gifterMap).map(([id, v]) => ({ sender_id: id, ...v })).sort((a, b) => b.total - a.total).slice(0, 5));
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const statCards = stats ? [
    { label: 'Diamonds Earned', value: stats.totalDiamonds.toLocaleString(), icon: Diamond, color: 'text-cyan' },
    { label: 'Subscribers', value: stats.totalSubscribers.toLocaleString(), icon: Users, color: 'text-violet' },
    { label: 'Total Streams', value: stats.streamCount.toLocaleString(), icon: Radio, color: 'text-rose' },
    { label: 'Stream Hours', value: `${stats.totalHours}h`, icon: TrendingUp, color: 'text-gold' },
  ] : [];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Creator Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">Your performance at a glance</p>
          </div>
          <Link href="/creator/studio" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-violet text-white text-sm font-semibold hover:bg-violet-light transition-all shadow-lg shadow-violet/20">
            <Radio className="h-4 w-4" /> Go Live
          </Link>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton rounded-2xl h-28" />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass rounded-2xl p-5">
              <card.icon className={cn('h-5 w-5 mb-3', card.color)} />
              <p className="text-2xl font-semibold text-white">{card.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Streams</h2>
            <Link href="/creator/studio" className="text-xs text-violet hover:text-violet-light flex items-center gap-1">Go Live <ArrowRight className="h-3 w-3" /></Link>
          </div>
          {recentStreams.length === 0 ? (
            <div className="text-center py-8"><p className="text-zinc-500 text-sm">No streams yet</p></div>
          ) : (
            <div className="space-y-3">
              {recentStreams.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <div>
                    <p className="text-sm text-white truncate max-w-[200px]">{s.title}</p>
                    <p className="text-xs text-zinc-500">{new Date(s.started_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-400">{s.viewer_count} viewers</p>
                    <p className="text-xs text-cyan">{s.total_gifts_received} 💎</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Top Gifters</h2>
          {topGifters.length === 0 ? (
            <div className="text-center py-8"><p className="text-zinc-500 text-sm">No gifts received yet</p></div>
          ) : (
            <div className="space-y-3">
              {topGifters.map((g, i) => (
                <div key={g.sender_id} className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-zinc-500 w-5">#{i + 1}</span>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet/60 to-cyan/60 flex items-center justify-center text-xs font-bold text-white">
                    {g.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1"><p className="text-sm text-white">@{g.username}</p></div>
                  <p className="text-sm font-semibold text-gold">{g.total.toLocaleString()} coins</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
