'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { X, Gift, Sparkles, Flame, Gem } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Gift },
  { id: 'trending', label: 'Trending', icon: Flame },
  { id: 'premium', label: 'Premium', icon: Gem },
];

export default function GiftPanel({ streamId, receiverId, onClose }: { streamId: string; receiverId: string; onClose: () => void; }) {
  const { user } = useAuthStore();
  const { coinBalance, setBalance } = useWalletStore();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    supabase.from('gift_catalog').select('*').eq('is_active', true).order('coin_cost')
      .then(({ data }) => {
        if (data) setCatalog(data);
        setLoading(false);
      });
  }, []);

  const filteredCatalog = catalog.filter(gift => {
    if (activeCategory === 'premium') return gift.coin_cost >= 1000;
    if (activeCategory === 'trending') return gift.coin_cost >= 100 && gift.coin_cost < 1000;
    return true;
  });

  const handleSend = async (gift: any) => {
    if (!user) { toast.error('Sign in to send gifts'); return; }
    if (coinBalance < gift.coin_cost) { toast.error('Insufficient coins! Recharge your wallet.'); return; }
    
    setSending(gift.id);
    try {
      const res = await fetch('/api/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: user.id, receiverId, streamId, giftId: gift.id, quantity: 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setBalance(coinBalance - data.coinsSpent, useWalletStore.getState().diamondBalance);
      toast.success(`Sent ${gift.name}!`, { icon: '✨' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(null);
    }
  };

  return (
    <motion.div 
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 bg-[#111113]/95 backdrop-blur-2xl border-t border-white/[0.08] p-4 pb-8 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
    >
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-fuchsia-400" />
            Gift Center
          </h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-black/50 border border-yellow-500/30 px-3 py-1.5 rounded-full">
              <span className="text-xl">🪙</span>
              <span className="text-yellow-400 font-bold text-sm">{coinBalance.toLocaleString()}</span>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                  activeCategory === cat.id 
                    ? "bg-white text-black shadow-lg shadow-white/20" 
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" /> {cat.label}
              </button>
            )
          })}
        </div>

        {/* Gift Grid */}
        <div className="h-64 overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
          {loading ? (
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white/5 animate-pulse h-28 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              <AnimatePresence>
                {filteredCatalog.map((gift) => (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={gift.id}
                    onClick={() => handleSend(gift)}
                    disabled={sending === gift.id || coinBalance < gift.coin_cost}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all aspect-square group overflow-hidden",
                      coinBalance >= gift.coin_cost 
                        ? "bg-gradient-to-b from-white/10 to-white/5 border-white/10 hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:scale-105 active:scale-95" 
                        : "bg-white/5 border-white/5 opacity-50 cursor-not-allowed grayscale-[50%]",
                      sending === gift.id && "animate-pulse"
                    )}
                  >
                    {gift.coin_cost >= 1000 && (
                      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/20 via-transparent to-transparent pointer-events-none" />
                    )}
                    <span className="text-4xl mb-2 group-hover:scale-110 transition-transform drop-shadow-2xl">{gift.emoji}</span>
                    <span className="text-[10px] text-white font-medium truncate w-full text-center leading-none">{gift.name}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[8px]">🪙</span>
                      <span className="text-[10px] text-yellow-400 font-bold">{gift.coin_cost}</span>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
