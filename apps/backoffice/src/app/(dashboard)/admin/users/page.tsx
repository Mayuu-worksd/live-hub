'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Shield, Ban, Coins, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';
import type { User } from '@/types/user';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    setLoading(true);
    const base = supabase.from('users').select('*').order('created_at', { ascending: false }).limit(50);
    const { data } = q
      ? await base.or(`email.ilike.%${q}%,username.ilike.%${q}%`)
      : await base;
    setUsers(data ?? []);
    setLoading(false);
  };

  useEffect(() => { search(''); }, []);

  const toggleBan = async (u: User) => {
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_banned: !u.is_banned }) });
    if (!res.ok) { toast.error('Failed to update ban status'); return; }
    setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, is_banned: !u.is_banned } : p));
    toast.success(u.is_banned ? 'User unbanned' : 'User banned');
  };

  const toggleVerify = async (u: User) => {
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_verified: !u.is_verified }) });
    if (!res.ok) { toast.error('Failed to update verification status'); return; }
    setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, is_verified: !u.is_verified } : p));
    toast.success(u.is_verified ? 'Verification removed' : 'Creator verified');
  };

  const changeRole = async (u: User, role: string) => {
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
    if (!res.ok) { toast.error('Failed to update role'); return; }
    setUsers((prev) => prev.map((p) => p.id === u.id ? { ...p, role: role as User['role'] } : p));
    toast.success('Role updated');
  };

  const handleAddCoins = async (u: User) => {
    const amountStr = prompt(`How many coins to add to @${u.username}?`, "10000");
    if (!amountStr) return;
    const amount = parseInt(amountStr);
    if (isNaN(amount) || amount <= 0) return toast.error("Invalid amount");

    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addCoins: amount })
    });
    if (!res.ok) return toast.error("Failed to add coins");
    toast.success(`Added ${amount} coins to @${u.username}`);
  };

  const handleSetRate = async (u: User) => {
    const rateStr = prompt(`Set coin rate per minute for @${u.username}:`, "50");
    if (!rateStr) return;
    const rate = parseInt(rateStr);
    if (isNaN(rate) || rate < 0) return toast.error("Invalid rate");

    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ setCoinRate: rate })
    });
    if (!res.ok) return toast.error("Failed to set rate");
    toast.success(`Call rate for @${u.username} set to ${rate} coins/min`);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-semibold text-white">User Management</h1>
      </motion.div>
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <input value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
          placeholder="Search by email or username…"
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet/50 transition-all"
        />
      </div>
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="glass rounded-xl px-4 py-3 flex items-center gap-4">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet/60 to-cyan/60 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white">@{u.username}</p>
                  {u.is_banned && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose/10 text-rose">Banned</span>}
                  {u.is_verified && <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet/10 text-violet">Verified</span>}
                </div>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              <select value={u.role} onChange={(e) => changeRole(u, e.target.value)}
                className="h-8 px-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-xs text-zinc-300 focus:outline-none">
                {['viewer', 'creator', 'verified_creator', 'moderator', 'agency_manager', 'admin', 'super_admin'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button onClick={() => toggleVerify(u)} title="Toggle Verification"
                className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                  u.is_verified ? 'bg-violet/20 text-violet' : 'bg-white/[0.05] text-zinc-500 hover:text-violet')}>
                <Shield className="h-4 w-4" />
              </button>
              <button onClick={() => handleAddCoins(u)} title="Add Coins"
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors bg-white/[0.05] text-zinc-500 hover:text-gold hover:bg-gold/10">
                <Coins className="h-4 w-4" />
              </button>
              <button onClick={() => handleSetRate(u)} title="Set Call Rate"
                className="h-8 w-8 rounded-lg flex items-center justify-center transition-colors bg-white/[0.05] text-zinc-500 hover:text-cyan hover:bg-cyan/10">
                <Settings className="h-4 w-4" />
              </button>
              <button onClick={() => toggleBan(u)} title="Ban User"
                className={cn('h-8 w-8 rounded-lg flex items-center justify-center transition-colors',
                  u.is_banned ? 'bg-rose/20 text-rose' : 'bg-white/[0.05] text-zinc-500 hover:text-rose')}>
                <Ban className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
