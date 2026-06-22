'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Flame } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { StreamCard } from '@/components/stream/StreamCard';
import type { Stream } from '@/types/stream';

const CATEGORIES = ['All', 'Gaming', 'Music', 'Talk', 'Dance', 'Sports', 'Food', 'Travel'];

export default function ExplorePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchStreams = useCallback(async (cat: string, p: number, replace: boolean) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p) });
    if (cat !== 'All') params.set('category', cat.toLowerCase());
    const res = await fetch(`/api/streams?${params}`);
    const data = await res.json();
    const list: Stream[] = data.streams ?? [];
    setStreams((prev) => replace ? list : [...prev, ...list]);
    setHasMore(list.length === 20);
    setLoading(false);
  }, []);

  useEffect(() => {
    setPage(1);
    fetchStreams(activeCategory, 1, true);
  }, [activeCategory, fetchStreams]);

  const filtered = query
    ? streams.filter((s) =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        (s.host as { username?: string })?.username?.toLowerCase().includes(query.toLowerCase())
      )
    : streams;

  return (
    <div className="px-6 py-8 max-w-[1280px] mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Flame className="h-5 w-5 text-rose" />
          <h1 className="text-2xl font-semibold text-white">Discover</h1>
        </div>
        <p className="text-sm text-zinc-500">Find live streams and creators</p>
      </motion.div>

      <div className="mb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search streams or creators…"
            className={cn(
              'w-full h-10 pl-10 pr-4 rounded-xl',
              'bg-white/[0.05] border border-white/[0.08]',
              'text-sm text-white placeholder:text-zinc-600',
              'focus:outline-none focus:border-primary/50 focus:glow-primary focus:bg-white/[0.07]',
              'transition-all duration-200'
            )}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all',
                activeCategory === cat
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white/[0.05] text-zinc-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-zinc-300'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading && streams.length === 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[9/16] rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <Flame className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No live streams right now</p>
          <button onClick={() => setActiveCategory('All')} className="mt-3 text-sm text-primary hover:text-primary/90 transition-colors">
            View all categories
          </button>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filtered.map((s, i) => (
              <StreamCard
                key={s.id}
                streamId={s.id}
                title={s.title}
                thumbnail={s.thumbnail_url ?? ''}
                creatorName={(s.host as { username?: string })?.username ?? ''}
                creatorAvatar={(s.host as { profile?: { avatar_url?: string } })?.profile?.avatar_url ?? ''}
                viewerCount={s.viewer_count}
                category={s.category}
                index={i}
              />
            ))}
          </div>
          {hasMore && !query && (
            <div className="mt-8 text-center">
              <button
                onClick={() => { const next = page + 1; setPage(next); fetchStreams(activeCategory, next, false); }}
                disabled={loading}
                className={cn('px-6 py-2.5 rounded-full text-sm font-medium bg-white/[0.05] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.08] transition-all disabled:opacity-50')}
              >
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
