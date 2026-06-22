'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface WithdrawalRow {
  id: string;
  diamond_amount: number;
  payment_method: string;
  payment_details: string;
  status: string;
  created_at: string;
  user: { username: string; email: string } | null;
}

export default function AdminFinancePage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('withdrawals')
      .select('*, user:users!user_id(username, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .then(({ data }) => { setWithdrawals((data ?? []) as WithdrawalRow[]); setLoading(false); });
  }, []);

  const process = async (id: string, approve: boolean) => {
    const { error } = await supabase.from('withdrawals').update({
      status: approve ? 'approved' : 'rejected',
      processed_at: new Date().toISOString(),
    }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));
    toast.success(approve ? 'Withdrawal approved' : 'Withdrawal rejected');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Finance</h1>
        <p className="text-sm text-zinc-500 mt-1">Pending withdrawal requests</p>
      </motion.div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-20" />)}</div>
      ) : withdrawals.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-zinc-500 text-sm">No pending withdrawals</p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((w) => (
            <div key={w.id} className="glass rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">@{w.user?.username}</p>
                  <span className="text-xs text-zinc-500">{w.user?.email}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {w.diamond_amount.toLocaleString()} 💎 via {w.payment_method} — {w.payment_details}
                </p>
                <p className="text-xs text-zinc-600">{new Date(w.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => process(w.id, false)}
                  className={cn('h-9 w-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:bg-rose/10 hover:text-rose hover:border-rose/30 transition-all')}>
                  <X className="h-4 w-4" />
                </button>
                <button onClick={() => process(w.id, true)}
                  className={cn('h-9 w-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:bg-emerald/10 hover:text-emerald hover:border-emerald/30 transition-all')}>
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
