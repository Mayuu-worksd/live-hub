'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDownToLine, Diamond } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface Withdrawal { id: string; diamond_amount: number; payment_method: string; status: string; created_at: string }

export default function AgencyPayoutsPage() {
  const { user } = useAuthStore();
  const [diamonds, setDiamonds] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [form, setForm] = useState({ amount: '', method: 'bank', details: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('wallets').select('diamond_balance').eq('user_id', user.id).single()
      .then(({ data }) => data && setDiamonds(data.diamond_balance));
    supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => data && setWithdrawals(data));
  }, [user]);

  const handleWithdraw = async () => {
    const amount = parseInt(form.amount);
    if (!amount || amount < 10000) { toast.error('Minimum 10,000 diamonds required'); return; }
    if (!form.details.trim()) { toast.error('Payment details required'); return; }
    setSubmitting(true);
    const res = await fetch('/api/withdrawals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user!.id, diamondAmount: amount, paymentMethod: form.method, paymentDetails: form.details }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); setSubmitting(false); return; }
    toast.success('Withdrawal request submitted!');
    setDiamonds((d) => d - amount);
    setWithdrawals((w) => [data.withdrawal, ...w]);
    setForm({ amount: '', method: 'bank', details: '' });
    setSubmitting(false);
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Agency Payouts</h1>
        <p className="text-sm text-zinc-500 mt-1">Withdraw your agency commission</p>
      </motion.div>

      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-xs text-zinc-400 mb-1">Commission Balance</p>
        <div className="flex items-end gap-2">
          <Diamond className="h-6 w-6 text-cyan mb-1" />
          <p className="text-4xl font-semibold text-white">{diamonds.toLocaleString()}</p>
        </div>
        <p className="text-xs text-zinc-500 mt-1">≈ ${(diamonds * 0.001).toFixed(2)} USD</p>
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Request Withdrawal</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Diamond Amount (min 10,000)</label>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="10000"
              className="w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet/50 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Payment Method</label>
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50 transition-all">
              <option value="bank">Bank Transfer</option>
              <option value="paypal">PayPal</option>
              <option value="upi">UPI</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Payment Details</label>
            <input type="text" value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Account / PayPal / UPI"
              className="w-full h-11 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet/50 transition-all" />
          </div>
          <button onClick={handleWithdraw} disabled={submitting}
            className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet text-white text-sm font-semibold hover:bg-violet-light transition-all shadow-lg shadow-violet/20 disabled:opacity-60 disabled:cursor-not-allowed')}>
            <ArrowDownToLine className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-white mb-4">Withdrawal History</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-6">No withdrawals yet</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div>
                  <p className="text-sm text-white">{w.diamond_amount.toLocaleString()} 💎 via {w.payment_method}</p>
                  <p className="text-xs text-zinc-500">{new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-1 rounded-full',
                  w.status === 'approved' ? 'bg-emerald/10 text-emerald' : w.status === 'pending' ? 'bg-gold/10 text-gold' : 'bg-rose/10 text-rose')}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
