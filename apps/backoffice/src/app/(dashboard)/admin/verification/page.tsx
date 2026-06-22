'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Shield, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface VerificationUser {
  id: string;
  username: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_banned: boolean;
  created_at: string;
  profile: { display_name: string | null; avatar_url: string | null; followers_count: number } | null;
}

export default function AdminVerificationPage() {
  const [users, setUsers] = useState<VerificationUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('unverified');

  const load = async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/creators?q=${encodeURIComponent(q)}`);
    const json = await res.json();
    setUsers(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(''); }, []);

  const toggleVerify = async (u: VerificationUser) => {
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_verified: !u.is_verified }),
    });
    if (!res.ok) { toast.error('Failed'); return; }
    setUsers(prev => prev.map(p => p.id === u.id ? { ...p, is_verified: !u.is_verified } : p));
    toast.success(u.is_verified ? 'Verification removed' : '✅ Creator verified!');
  };

  const filtered = users.filter(u => {
    if (filter === 'verified') return u.is_verified;
    if (filter === 'unverified') return !u.is_verified;
    return true;
  });

  const verifiedCount = users.filter(u => u.is_verified).length;
  const pendingCount = users.filter(u => !u.is_verified).length;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Creator Verification</h1>
        <p className="text-sm text-zinc-500 mt-1">Grant or revoke the verified badge for creators</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Creators', value: users.length, color: 'text-zinc-300' },
          { label: 'Verified', value: verifiedCount, color: 'text-violet' },
          { label: 'Pending / Unverified', value: pendingCount, color: 'text-orange-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs + Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1.5">
          {(['all', 'unverified', 'verified'] as const).map(tab => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={cn('h-8 px-3 rounded-lg text-xs font-medium capitalize transition-colors border',
                filter === tab
                  ? 'bg-violet/20 text-violet border-violet/30'
                  : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white'
              )}>
              {tab}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input value={query}
            onChange={e => { setQuery(e.target.value); load(e.target.value); }}
            placeholder="Search creator…"
            className="w-full h-8 pl-9 pr-4 rounded-lg bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none" />
          {query && (
            <button onClick={() => { setQuery(''); load(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ShieldCheck className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No creators in this category</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filtered.map((u, i) => (
              <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="glass rounded-xl px-4 py-3 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet/60 to-cyan/60 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden border border-white/10">
                  {u.profile?.avatar_url ? (
                    <img src={u.profile.avatar_url} className="h-full w-full object-cover" alt="" />
                  ) : u.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">@{u.username}</p>
                    {u.is_verified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet/10 text-violet border border-violet/20">Verified</span>
                    )}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500 capitalize">{u.role.replace('_', ' ')}</span>
                  </div>
                  <p className="text-xs text-zinc-500">{u.email}</p>
                  <p className="text-xs text-zinc-600">{(u.profile?.followers_count ?? 0).toLocaleString()} followers · joined {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => toggleVerify(u)}
                  className={cn('flex items-center gap-2 h-9 px-4 rounded-xl text-sm font-medium border transition-all',
                    u.is_verified
                      ? 'bg-violet/20 text-violet border-violet/30 hover:bg-rose/10 hover:text-rose hover:border-rose/30'
                      : 'bg-white/[0.05] text-zinc-400 border-white/[0.08] hover:bg-violet/10 hover:text-violet hover:border-violet/30'
                  )}>
                  {u.is_verified ? <><Shield className="h-3.5 w-3.5" />Revoke</> : <><ShieldCheck className="h-3.5 w-3.5" />Verify</>}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
