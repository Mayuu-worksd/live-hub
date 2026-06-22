'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Banknote, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase/client';

interface Withdrawal {
  id: string;
  diamond_amount: number;
  payment_method: string;
  payment_details: string;
  status: string;
  created_at: string;
  processed_at: string | null;
  user: { username: string; email: string } | null;
}

const DIAMOND_RATE = 0.005; // $0.005 per diamond — matches finance page

const statusStyle: Record<string, string> = {
  pending: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  approved: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  rejected: 'text-rose bg-rose/10 border-rose/20',
};

export default function FinanceWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/backoffice/withdrawals');
    const json = await res.json();

    // The basic API doesn't join users — enrich with user data
    const ids = (json.data ?? []).map((w: any) => w.user_id).filter(Boolean);
    let userMap: Record<string, { username: string; email: string }> = {};
    if (ids.length > 0) {
      const { data: users } = await supabase.from('users').select('id, username, email').in('id', ids);
      (users ?? []).forEach((u: any) => { userMap[u.id] = { username: u.username, email: u.email }; });
    }

    setWithdrawals(
      (json.data ?? []).map((w: any) => ({ ...w, user: userMap[w.user_id] ?? null }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-withdrawals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'withdrawals' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) { toast.error('Action failed'); setProcessingId(null); return; }
    const json = await res.json();
    setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, ...json.data } : w));
    toast.success(action === 'approve' ? '✅ Withdrawal approved' : '❌ Withdrawal rejected');
    setProcessingId(null);
  };

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter(w => w.status === filter);

  const stats = {
    pending: withdrawals.filter(w => w.status === 'pending').length,
    totalPendingUsd: withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.diamond_amount * DIAMOND_RATE, 0),
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">All Withdrawals</h1>
          <p className="text-sm text-zinc-500 mt-1">Complete history of all creator payout requests</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 h-9 px-3 rounded-xl bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 text-sm transition-colors disabled:opacity-50">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          Refresh
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending Requests', value: stats.pending, sub: `$${stats.totalPendingUsd.toFixed(2)} pending`, color: 'text-orange-400' },
          { label: 'Approved', value: stats.approved, sub: 'paid out', color: 'text-emerald-400' },
          { label: 'Rejected', value: stats.rejected, sub: 'declined', color: 'text-rose' },
          { label: 'Total Requests', value: withdrawals.length, sub: 'all time', color: 'text-zinc-300' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-sm text-zinc-300 mt-0.5">{s.label}</p>
            <p className="text-xs text-zinc-600">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={cn('h-8 px-4 rounded-lg text-xs font-medium capitalize transition-colors border',
              filter === tab
                ? 'bg-violet/20 text-violet border-violet/30'
                : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
            )}>
            {tab} {tab !== 'all' && <span className="ml-1 opacity-60">({withdrawals.filter(w => w.status === tab).length})</span>}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Banknote className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No withdrawals in this category</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="glass rounded-xl px-5 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-white">@{w.user?.username ?? 'Unknown'}</p>
                    <span className="text-xs text-zinc-500">{w.user?.email}</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    💎 {w.diamond_amount.toLocaleString()} diamonds
                    <span className="text-zinc-600 ml-1">(≈ ${(w.diamond_amount * DIAMOND_RATE).toFixed(2)})</span>
                    {' · '}
                    <span className="capitalize">{w.payment_method}</span>
                    {' · '}
                    <span className="text-zinc-500">{w.payment_details}</span>
                  </p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Requested {new Date(w.created_at).toLocaleString()}
                    {w.processed_at && <> · Processed {new Date(w.processed_at).toLocaleString()}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full border font-medium capitalize', statusStyle[w.status] ?? 'text-zinc-400 bg-white/5 border-white/10')}>
                    {w.status}
                  </span>
                  {w.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(w.id, 'reject')}
                        disabled={processingId === w.id}
                        className="h-8 w-8 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-rose hover:bg-rose/10 flex items-center justify-center transition-colors disabled:opacity-50">
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleAction(w.id, 'approve')}
                        disabled={processingId === w.id}
                        className="h-8 w-8 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 flex items-center justify-center transition-colors disabled:opacity-50">
                        <Check className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
