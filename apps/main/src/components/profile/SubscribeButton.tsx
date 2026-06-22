'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { Star, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SubscribeButton({ creatorId, creatorName }: { creatorId: string, creatorName: string }) {
  const { user } = useAuthStore();
  const { coinBalance, setBalance } = useWalletStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchPlansAndSubs = async () => {
      const [plansRes, subsRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').eq('creator_id', creatorId),
        supabase.from('subscriptions').select('*').eq('subscriber_id', user.id).eq('creator_id', creatorId).eq('status', 'active').single()
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (subsRes.data) setActiveSub(subsRes.data);
      setLoading(false);
    };

    fetchPlansAndSubs();
  }, [user, creatorId]);

  const handleSubscribe = async (plan: any) => {
    if (!user) { toast.error('Sign in to subscribe'); return; }
    if (coinBalance < plan.coin_price) { toast.error('Insufficient coins'); return; }

    setSubscribing(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', creatorId, viewerId: user.id, planId: plan.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBalance(coinBalance - plan.coin_price, useWalletStore.getState().diamondBalance);
      setActiveSub(data.subscription);
      toast.success(`Subscribed to ${creatorName}!`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <button disabled className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-transparent relative"><Loader2 className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" /></button>;

  if (activeSub) {
    return (
      <button disabled className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white font-semibold">
        <Star className="h-4 w-4 fill-gold text-gold" /> Subscribed
      </button>
    );
  }

  if (plans.length === 0) {
    return null; // Creator has no plans
  }

  // Assuming creator has 1 plan for now to keep UI simple
  const plan = plans[0];

  return (
    <button 
      onClick={() => handleSubscribe(plan)}
      disabled={subscribing}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gold text-black font-semibold hover:bg-gold/90 transition-all shadow-lg shadow-gold/20 disabled:opacity-50"
    >
      <Star className="h-4 w-4" />
      {subscribing ? 'Processing...' : `Subscribe (${plan.coin_price} 🪙)`}
    </button>
  );
}
