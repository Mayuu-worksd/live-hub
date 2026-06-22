'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Gift, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

interface GiftItem {
  id: string;
  name: string;
  emoji: string;
  coin_cost: number;
  category: string;
  animation_url: string | null;
  is_active: boolean;
}

const CATEGORIES = ['basic', 'premium', 'ultra'];
const EMPTY_FORM = { name: '', emoji: '', coin_cost: '', category: 'basic', animation_url: '', is_active: true };

export default function GiftCatalogPage() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/finance/gifts');
    const json = await res.json();
    setGifts(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (g: GiftItem) => {
    setEditingId(g.id);
    setForm({
      name: g.name,
      emoji: g.emoji,
      coin_cost: String(g.coin_cost),
      category: g.category,
      animation_url: g.animation_url ?? '',
      is_active: g.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.coin_cost || !form.category) {
      toast.error('Name, Cost, and Category are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name,
      emoji: form.emoji,
      coin_cost: parseInt(form.coin_cost),
      category: form.category,
      animation_url: form.animation_url || null,
      is_active: form.is_active,
    };

    const url = editingId ? `/api/admin/finance/gifts/${editingId}` : '/api/admin/finance/gifts';
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) { toast.error('Failed to save gift'); setSaving(false); return; }
    toast.success(editingId ? 'Gift updated' : 'Gift created');
    setShowForm(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this gift?')) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/finance/gifts/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('Failed to delete'); setDeletingId(null); return; }
    toast.success('Gift deleted');
    setGifts(prev => prev.filter(g => g.id !== id));
    setDeletingId(null);
  };

  const toggleActive = async (g: GiftItem) => {
    const res = await fetch(`/api/admin/finance/gifts/${g.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !g.is_active }),
    });
    if (!res.ok) { toast.error('Failed'); return; }
    setGifts(prev => prev.map(p => p.id === g.id ? { ...p, is_active: !g.is_active } : p));
    toast.success(g.is_active ? 'Gift deactivated' : 'Gift activated');
  };

  const categoryColor: Record<string, string> = {
    basic: 'text-zinc-300 bg-white/5',
    premium: 'text-gold bg-gold/10',
    ultra: 'text-cyan bg-cyan/10',
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Gift Catalog</h1>
          <p className="text-sm text-zinc-500 mt-1">Gifts users can send during live streams. Changes are immediate.</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-violet text-white text-sm font-medium hover:bg-violet/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Gift
        </button>
      </motion.div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#111113] border border-white/[0.08] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">{editingId ? 'Edit Gift' : 'New Gift'}</h2>
                <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X className="h-5 w-5" /></button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-zinc-400 mb-1 block">Gift Name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Crown"
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Emoji</label>
                    <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                      placeholder="👑"
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50 text-center text-lg" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Coin Cost</label>
                    <input value={form.coin_cost} onChange={e => setForm(f => ({ ...f, coin_cost: e.target.value }))}
                      type="number" placeholder="100"
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50" />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-400 mb-1 block">Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-zinc-300 focus:outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Animation URL (optional)</label>
                  <input value={form.animation_url} onChange={e => setForm(f => ({ ...f, animation_url: e.target.value }))}
                    placeholder="https://..."
                    className="w-full h-10 px-3 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-violet/50" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-zinc-300">Active (visible to users)</span>
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 h-10 rounded-xl border border-white/[0.08] text-sm text-zinc-400 hover:text-white transition-colors">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 h-10 rounded-xl bg-violet text-white text-sm font-medium hover:bg-violet/90 disabled:opacity-50 transition-colors">
                  {saving ? 'Saving…' : 'Save Gift'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gifts Table */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton rounded-xl h-14" />)}</div>
      ) : gifts.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Gift className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No gifts in catalog</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Gift</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-zinc-500">Category</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Cost</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-zinc-500">Status</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {gifts.map((g, i) => (
                  <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className={cn('border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors', !g.is_active && 'opacity-40')}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{g.emoji || '🎁'}</span>
                        <span className="font-medium text-white">{g.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', categoryColor[g.category] ?? 'text-zinc-400 bg-white/5')}>
                        {g.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className="text-gold font-bold">🪙 {g.coin_cost.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <button onClick={() => toggleActive(g)}
                        className={cn('text-xs px-2 py-0.5 rounded-full font-medium border transition-colors',
                          g.is_active
                            ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10 hover:bg-rose/10 hover:text-rose hover:border-rose/30'
                            : 'text-zinc-500 border-zinc-700 bg-white/5 hover:bg-emerald/10 hover:text-emerald-400 hover:border-emerald-400/30'
                        )}>
                        {g.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openEdit(g)}
                          className="h-7 w-7 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => handleDelete(g.id)} disabled={deletingId === g.id}
                          className="h-7 w-7 rounded-lg bg-white/[0.05] text-zinc-400 hover:text-rose hover:bg-rose/10 flex items-center justify-center transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
