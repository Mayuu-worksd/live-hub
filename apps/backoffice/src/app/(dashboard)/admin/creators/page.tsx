'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, Ban, Coins, Settings, TrendingUp, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface Creator {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
    followers_count: number;
    total_earned: number;
  } | null;
  wallet: {
    coin_balance: number;
    diamond_balance: number;
    total_earned: number;
  } | null;
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/creators?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setCreators(json.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(''); }, [fetch_]);

  const handleSearch = (val: string) => {
    setQuery(val);
    fetch_(val);
  };

  const toggleBan = async (c: Creator) => {
    const res = await fetch(`/api/admin/users/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_banned: !c.is_banned }),
    });
    if (!res.ok) { toast.error('Failed'); return; }
    setCreators(prev => prev.map(p => p.id === c.id ? { ...p, is_banned: !c.is_banned } : p));
    toast.success(c.is_banned ? 'Creator unbanned' : 'Creator banned');
  };

  const toggleVerify = async (c: Creator) => {
    const res = await fetch(`/api/admin/users/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_verified: !c.is_verified }),
    });
    if (!res.ok) { toast.error('Failed'); return; }
    setCreators(prev => prev.map(p => p.id === c.id ? { ...p, is_verified: !c.is_verified } : p));
    toast.success(c.is_verified ? 'Verification removed' : 'Creator verified');
  };

  const handleSetRate = async (c: Creator) => {
    const rateStr = prompt(`Set coin rate per minute for @${c.username}:`, '50');
    if (!rateStr) return;
    const rate = parseInt(rateStr);
    if (isNaN(rate) || rate < 0) return toast.error('Invalid rate');
    const res = await fetch(`/api/admin/users/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setCoinRate: rate }),
    });
    if (!res.ok) return toast.error('Failed to set rate');
    toast.success(`Call rate set to ${rate} coins/min`);
  };

  const handleAddCoins = async (c: Creator) => {
    const amountStr = prompt(`Add coins to @${c.username}:`, '1000');
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return toast.error('Invalid amount');
    const res = await fetch(`/api/admin/users/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addCoins: amount }),
    });
    if (!res.ok) return toast.error('Failed to add coins');
    toast.success(`Added ${amount} coins to @${c.username}`);
  };

  // Summary stats
  const totalCreators = creators.length;
  const verifiedCount = creators.filter(c => c.is_verified).length;
  const totalDiamonds = creators.reduce((sum, c) => sum + (c.wallet?.diamond_balance ?? 0), 0);
  const totalFollowers = creators.reduce((sum, c) => sum + (c.profile?.followers_count ?? 0), 0);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Creator Management</h1>
        <p className="text-sm text-zinc-500 mt-1">Users with creator or verified_creator roles</p>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Creators', value: totalCreators.toLocaleString(), icon: Users, color: 'text-violet' },
          { label: 'Verified', value: verifiedCount.toLocaleString(), icon: Shield, color: 'text-cyan' },
          { label: 'Total Followers', value: totalFollowers.toLocaleString(), icon: TrendingUp, color: 'text-gold' },
          { label: 'Diamonds Held', value: totalDiamonds.toLocaleString(), icon: Coins, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 flex items-center gap-3">
            <div className={cn('p-2 rounded-lg bg-white/5', s.color)}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{s.value}</p>
              <p className="text-xs text-zinc-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by email or username…"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet/50 transition-all"
        />
        {query && (
          <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton rounded-xl h-16" />
          ))}
        </div>
      ) : creators.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Users className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No creators found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {creators.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet/60 to-cyan/60 flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden border border-white/10">
                  {c.profile?.avatar_url ? (
                    <img src={c.profile.avatar_url} className="h-full w-full object-cover" alt="" />
                  ) : (
                    c.username[0].toUpperCase()
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">@{c.username}</p>
                    {c.is_verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet/10 text-violet border border-violet/20">Verified</span>}
                    {c.is_banned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose/10 text-rose">Banned</span>}
                  </div>
                  <p className="text-xs text-zinc-500">{c.email}</p>
                </div>

                {/* Stats */}
                <div className="hidden md:flex items-center gap-6 text-xs text-zinc-400">
                  <div className="text-center">
                    <p className="text-white font-medium">{(c.profile?.followers_count ?? 0).toLocaleString()}</p>
                    <p className="text-zinc-600">followers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">💎 {(c.wallet?.diamond_balance ?? 0).toLocaleString()}</p>
                    <p className="text-zinc-600">diamonds</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-medium">🪙 {(c.wallet?.coin_balance ?? 0).toLocaleString()}</p>
                    <p className="text-zinc-600">coins</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <button onClick={() => toggleVerify(c)} title="Toggle Verification"
                    className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                      c.is_verified ? 'bg-violet/20 text-violet' : 'bg-white/[0.05] text-zinc-500 hover:text-violet hover:bg-violet/10')}>
                    <Shield className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleAddCoins(c)} title="Add Coins"
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors bg-white/[0.05] text-zinc-500 hover:text-gold hover:bg-gold/10">
                    <Coins className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleSetRate(c)} title="Set Call Rate"
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors bg-white/[0.05] text-zinc-500 hover:text-cyan hover:bg-cyan/10">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button onClick={() => toggleBan(c)} title={c.is_banned ? 'Unban' : 'Ban'}
                    className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                      c.is_banned ? 'bg-rose/20 text-rose' : 'bg-white/[0.05] text-zinc-500 hover:text-rose hover:bg-rose/10')}>
                    <Ban className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
