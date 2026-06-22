'use client';

import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, ShieldCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

interface SearchResult {
  id: string;
  username: string;
  role: string;
  is_verified: boolean;
  profile?: {
    display_name?: string;
    avatar_url?: string;
    followers_count: number;
  };
}

export function SearchComponent() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (username: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(`/profile/${username}`);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
        placeholder="Search creators, users…"
        className={cn(
          'w-full h-10 pl-10 pr-10 rounded-xl',
          'bg-[#1A1A1A] border border-white/[0.08]',
          'text-sm text-white placeholder:text-zinc-500',
          'focus:outline-none focus:border-primary/50 focus:glow-primary focus:bg-white/[0.07]',
          'transition-all duration-200'
        )}
      />
      {query && (
        <button onClick={() => { setQuery(''); setIsOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-12 left-0 right-0 bg-[#111113] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          {loading ? (
            <div className="p-4 flex items-center justify-center">
              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result.username)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                    {result.profile?.avatar_url ? (
                      <img src={result.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-white text-xs font-bold">{result.username[0].toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-sm font-semibold truncate">
                        {result.profile?.display_name || result.username}
                      </span>
                      {result.is_verified && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">@{result.username} • {result.profile?.followers_count || 0} followers</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-zinc-500 text-sm">No results found</div>
          )}
        </div>
      )}
    </div>
  );
}
