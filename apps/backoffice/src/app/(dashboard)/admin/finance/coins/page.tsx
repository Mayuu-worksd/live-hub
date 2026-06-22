'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Star, Package, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price_usd: number;
  price_inr: number;
  bonus_coins: number;
  is_popular: boolean;
  is_active: boolean;
}

const EMPTY_FORM = { name: '', coins: '', price_usd: '', price_inr: '', bonus_coins: '0', is_popular: false, is_active: true };

export default function CoinPackagesPage() {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/finance/coins');
    const json = await res.json();
    setPackages(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (pkg: CoinPackage) => {
    setEditingId(pkg.id);
    setForm({
      name: pkg.name,
      coins: String(pkg.coins),
      price_usd: String(pkg.price_usd),
      price_inr: String(pkg.price_inr),
      bonus_coins: String(pkg.bonus_coins),
      is_popular: pkg.is_popular,
      is_active: pkg.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.coins || !form.price_usd) {
      toast.error('Name, Coins, and USD Price are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      coins: parseInt(form.coins),
      price_usd: parseFloat(form.price_usd),
      price_inr: parseFloat(form.price_inr || '0'),
      bonus_coins: parseInt(form.bonus_coins || '0'),
      is_popular: form.is_popular,
      is_active: form.is_active,
    };

    const url = editingId ? `/api/admin/finance/coins/${editingId}` : '/api/admin/finance/coins';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { toast.error('Failed to save package'); setSaving(false); return; }
    toast.success(editingId ? 'Package updated' : 'Package created');
    setShowForm(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await fetch(`/api/admin/finance/coins/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); setDeletingId(null); return; }
    toast.success('Package deleted');
    setPackages(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const toggleActive = async (pkg: CoinPackage) => {
    const res = await fetch(`/api/admin/finance/coins/${pkg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !pkg.is_active }),
    });
    if (!res.ok) { toast.error('Failed'); return; }
    setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, is_active: !pkg.is_active } : p));
    toast.success(pkg.is_active ? 'Package deactivated' : 'Package activated');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Coin Packages</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage purchasable coin bundles. Changes take effect immediately.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-violet text-white text-sm font-medium hover:bg-violet/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Package
        </button>
      </motion.div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#111113] border border-white/[0.08] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Package' : 'New Package'}</h2>
                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Package Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Popular"
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Coins</label>
                    <input value={form.coins} onChange={e => setForm(f => ({ ...f, coins: e.target.value }))}
                      type="number" placeholder="1200"
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Bonus Coins</label>
                    <input value={form.bonus_coins} onChange={e => setForm(f => ({ ...f, bonus_coins: e.target.value }))}
                      type="number" placeholder="200"
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Price (USD)</label>
                    <input value={form.price_usd} onChange={e => setForm(f => ({ ...f, price_usd: e.target.value }))}
                      type="number" step="0.01" placeholder="9.99"
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Price (INR)</label>
                    <input value={form.price_inr} onChange={e => setForm(f => ({ ...f, price_inr: e.target.value }))}
                      type="number" placeholder="830"
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50" />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))}
                      className="rounded" />
                    <span className="text-sm text-zinc-300">Mark as Popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                      className="rounded" />
                    <span className="text-sm text-zinc-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:text-white hover:border-white/20 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-violet text-white text-sm font-medium hover:bg-violet/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Save Package'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Packages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton rounded-2xl h-40" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Package className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No coin packages yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {packages.map((pkg, i) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn(
                  'glass rounded-2xl p-5 relative border transition-all',
                  pkg.is_popular ? 'border-gold/40' : 'border-white/[0.08]',
                  !pkg.is_active && 'opacity-50'
                )}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-0.5 rounded-full bg-gold text-black text-[10px] font-bold">
                    <Star className="h-3 w-3" /> POPULAR
                  </div>
                )}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{pkg.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{pkg.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(pkg)}
                      className="h-7 w-7 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(pkg.id)} disabled={deletingId === pkg.id}
                      className="h-7 w-7 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-rose hover:bg-rose/10 flex items-center justify-center transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500">Coins</span>
                    <span className="text-sm font-bold text-gold">🪙 {pkg.coins.toLocaleString()}</span>
                  </div>
                  {pkg.bonus_coins > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-zinc-500">Bonus</span>
                      <span className="text-sm font-medium text-emerald-400">+{pkg.bonus_coins.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.05]">
                    <span className="text-xs text-zinc-500">Price</span>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">${pkg.price_usd}</p>
                      <p className="text-xs text-zinc-500">₹{pkg.price_inr}</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => toggleActive(pkg)}
                  className={cn('mt-4 w-full h-8 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5',
                    pkg.is_active
                      ? 'bg-white/5 text-zinc-400 hover:bg-rose/10 hover:text-rose'
                      : 'bg-emerald/10 text-emerald hover:bg-emerald/20'
                  )}>
                  {pkg.is_active ? <><X className="h-3 w-3" />Deactivate</> : <><Check className="h-3 w-3" />Activate</>}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
