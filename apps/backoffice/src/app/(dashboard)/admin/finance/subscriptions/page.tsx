'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Star, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface SubPlan {
  id: string;
  name: string;
  coin_price: number;
  duration_days: number;
  benefits: string[] | null;
  created_at: string;
  active_subscribers: number;
  creator: { id: string; username: string; is_verified: boolean } | null;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/finance/subscriptions')
      .then(r => r.json())
      .then(j => { setPlans(j.data ?? []); setLoading(false); });
  }, []);

  const totalSubscribers = plans.reduce((s, p) => s + p.active_subscribers, 0);
  const totalRevenue = plans.reduce((s, p) => s + p.coin_price * p.active_subscribers, 0);
  const activePlans = plans.filter(p => p.active_subscribers > 0).length;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Subscription Plans</h1>
        <p className="text-sm text-zinc-500 mt-1">All creator subscription plans and their active subscribers</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Plans', value: plans.length, icon: Star, color: 'text-violet' },
          { label: 'Active Plans', value: activePlans, icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'Total Subscribers', value: totalSubscribers.toLocaleString(), icon: Users, color: 'text-cyan' },
          { label: 'Monthly Revenue (Coins)', value: totalRevenue.toLocaleString(), icon: Calendar, color: 'text-gold' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-white/5', s.color)}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-14" />)}</div>
      ) : plans.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Star className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No subscription plans created yet</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Creator</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Plan Name</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Coin Price</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Duration</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Subscribers</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Monthly Revenue</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p, i) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">@{p.creator?.username ?? 'Unknown'}</p>
                      {p.creator?.is_verified && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet/10 text-violet border border-violet/20">Verified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-white">{p.name}</p>
                    {p.benefits && p.benefits.length > 0 && (
                      <p className="text-xs text-zinc-500 mt-0.5">{p.benefits.slice(0, 2).join(', ')}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="text-gold font-bold">🪙 {p.coin_price.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-300">{p.duration_days}d</td>
                  <td className="px-5 py-3 text-right">
                    <span className={cn('font-bold', p.active_subscribers > 0 ? 'text-emerald-400' : 'text-zinc-600')}>
                      {p.active_subscribers}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-zinc-300">
                    {p.active_subscribers > 0 ? (
                      <span className="text-gold">🪙 {(p.coin_price * p.active_subscribers).toLocaleString()}</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
