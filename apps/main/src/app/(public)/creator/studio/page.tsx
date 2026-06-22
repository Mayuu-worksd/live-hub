'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Radio, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils/cn';
import toast from 'react-hot-toast';

const CATEGORIES = ['Gaming', 'Music', 'Talk', 'Dance', 'Sports', 'Food', 'Travel', 'Education'];

export default function StudioPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; category?: string }>({});

  useEffect(() => {
    if (!user) return;
    // Check if creator already has an active live stream
    supabase
      .from('streams')
      .select('id')
      .eq('host_id', user.id)
      .eq('status', 'live')
      .single()
      .then(({ data }) => {
        if (data) {
          toast.success('Reconnecting to active stream...', { id: 'reconnect-toast' });
          router.replace(`/live/${data.id}`);
        } else {
          setLoading(false);
        }
      });
  }, [user, router]);

  const handleGoLive = async () => {
    const e: typeof errors = {};
    if (!title.trim()) e.title = 'Stream title is required';
    if (!category) e.category = 'Select a category';
    if (Object.keys(e).length) { setErrors(e); return; }
    if (!user) { toast.error('You must be signed in'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostId: user.id, title: title.trim(), category: category.toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to start stream'); return; }
      router.push(`/live/${data.stream.id}`);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !title) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="h-8 w-8 rounded-full border-2 border-violet border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet/10 mb-6">
          <Radio className="h-7 w-7 text-violet" />
        </div>
        <h1 className="text-2xl font-semibold text-white text-center">Go Live</h1>
        <p className="mt-2 text-sm text-zinc-500 text-center max-w-sm mx-auto">
          Set up your stream and start broadcasting to the world.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Stream Title *</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((er) => { const n = { ...er }; delete n.title; return n; }); }}
              placeholder="What are you streaming today?"
              className={cn(
                'w-full h-11 px-4 rounded-xl bg-white/[0.05] border text-sm text-white placeholder:text-zinc-600',
                'focus:outline-none focus:bg-white/[0.07] transition-all',
                errors.title ? 'border-rose/50' : 'border-white/[0.08] focus:border-violet/50'
              )}
            />
            {errors.title && <p className="mt-1 text-xs text-rose">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category *</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat); setErrors((er) => { const n = { ...er }; delete n.category; return n; }); }}
                  className={cn(
                    'h-9 rounded-xl text-xs font-medium transition-all',
                    category === cat
                      ? 'bg-violet text-white shadow-lg shadow-violet/20'
                      : 'bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            {errors.category && <p className="mt-1 text-xs text-rose">{errors.category}</p>}
          </div>

          <button
            onClick={handleGoLive}
            disabled={loading}
            className={cn(
              'w-full flex items-center justify-center gap-2 h-12 rounded-xl mt-2',
              'bg-violet text-white font-semibold',
              'hover:bg-violet-light transition-all shadow-lg shadow-violet/20',
              'disabled:opacity-60 disabled:cursor-not-allowed'
            )}
          >
            {loading ? 'Starting stream…' : 'Go Live'}
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
