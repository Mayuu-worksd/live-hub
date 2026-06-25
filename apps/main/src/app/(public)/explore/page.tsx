'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { AuthModal } from '@/components/auth/AuthModal';
import { cn } from '@/lib/utils/cn';
import {
  Search, Radio, Eye, Heart, Gift, UserPlus, Bell, Coins,
  X, Play, Gamepad2, Music, Mic, BadgeCheck, Zap, TrendingUp,
  Users, MessageCircle, Share2, Bookmark, Star,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Creator {
  id: string;
  username: string;
  displayName: string;
  verified: boolean;
  followers: string;
  avatar: string;
  isLive: boolean;
  category: string;
  title: string;
  viewers: string;
  likes: string;
  thumbnail: string;
  accent: string; // tailwind gradient classes for hover overlay
  tall?: boolean; // span taller in masonry
}

// ─── Mock creators (12 cards, rich variety) ───────────────────────────────────
const CREATORS: Creator[] = [
  {
    id: '1', username: 'sophia_live', displayName: 'Sophia', verified: true,
    followers: '1.4M', isLive: true, category: 'Dance',
    title: 'Late night dance party 🔥', viewers: '12.4K', likes: '89.2K',
    thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=650&fit=crop&crop=face',
    accent: 'from-rose-600/70 to-pink-900/50', tall: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '2', username: 'shine_official', displayName: 'Shine ✨', verified: true,
    followers: '5.9M', isLive: true, category: 'Music',
    title: 'Acoustic sessions 🎵', viewers: '8.2K', likes: '156K',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=500&fit=crop',
    accent: 'from-violet-600/70 to-purple-900/50',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=80&h=80&fit=crop',
  },
  {
    id: '3', username: 'priya_streams', displayName: 'Priya 🌸', verified: false,
    followers: '1.5M', isLive: true, category: 'Talk Show',
    title: 'Morning motivation & chai ☕', viewers: '5.7K', likes: '42.1K',
    thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=560&fit=crop&crop=face',
    accent: 'from-amber-500/70 to-orange-900/50',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '4', username: 'gamerpro99', displayName: 'GamerPro 🎮', verified: true,
    followers: '3.2M', isLive: true, category: 'Gaming',
    title: 'Grand Finals — carry diff 💀', viewers: '22.1K', likes: '330K',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=640&fit=crop',
    accent: 'from-emerald-600/70 to-teal-900/50', tall: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '5', username: 'luna_live', displayName: 'Luna 🌙', verified: true,
    followers: '4.1M', isLive: true, category: 'Talk Show',
    title: 'Late night just chatting & vibes 💬', viewers: '15.3K', likes: '287K',
    thumbnail: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=550&fit=crop&crop=face',
    accent: 'from-rose-500/70 to-red-900/50',
    avatar: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '6', username: 'dj_rhythm', displayName: 'DJ Rhythm 🎧', verified: true,
    followers: '2.1M', isLive: true, category: 'Music',
    title: 'Techno Friday Night Set 🎛️', viewers: '9.8K', likes: '201K',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=500&fit=crop',
    accent: 'from-blue-600/70 to-indigo-900/50',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '7', username: 'dance_queen', displayName: 'DanceQueen 💃', verified: true,
    followers: '890K', isLive: false, category: 'Dance',
    title: 'Freestyle session highlights', viewers: '445K', likes: '88.4K',
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=600&fit=crop',
    accent: 'from-pink-500/70 to-fuchsia-900/50', tall: true,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '8', username: 'aether_beats', displayName: 'AetherBeats 🎶', verified: true,
    followers: '2.4M', isLive: true, category: 'Music',
    title: 'Midnight synth sessions vol. 12', viewers: '11.2K', likes: '190K',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=520&fit=crop',
    accent: 'from-purple-600/70 to-violet-900/50',
    avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=80&h=80&fit=crop',
  },
  {
    id: '9', username: 'chefmike', displayName: 'Chef Mike 👨‍🍳', verified: false,
    followers: '560K', isLive: true, category: 'Lifestyle',
    title: 'Korean BBQ night! Come cook with me 🔥', viewers: '4.3K', likes: '31.2K',
    thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=500&fit=crop',
    accent: 'from-red-500/70 to-rose-900/50',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '10', username: 'talkwithsam', displayName: 'Talk with Sam 🎙️', verified: true,
    followers: '1.1M', isLive: true, category: 'Talk Show',
    title: 'Deep talks & vibes, episode 47', viewers: '6.1K', likes: '78.9K',
    thumbnail: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=640&fit=crop&crop=face',
    accent: 'from-cyan-600/70 to-sky-900/50', tall: true,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '11', username: 'nova_dance', displayName: 'Nova 🌟', verified: false,
    followers: '780K', isLive: true, category: 'Dance',
    title: 'Hip hop battle time 🕺', viewers: '3.8K', likes: '28.7K',
    thumbnail: 'https://images.unsplash.com/photo-1526510747491-58f928ec870f?w=400&h=520&fit=crop',
    accent: 'from-orange-500/70 to-amber-900/50',
    avatar: 'https://images.unsplash.com/photo-1512316609839-ce289d3eba0a?w=80&h=80&fit=crop&crop=face',
  },
  {
    id: '12', username: 'retro_speed', displayName: 'RetroSpeed ⚡', verified: true,
    followers: '1.8M', isLive: false, category: 'Gaming',
    title: 'Speedrunning Classics — PB Attempt 🎯', viewers: '98.4K', likes: '165K',
    thumbnail: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=550&fit=crop',
    accent: 'from-lime-600/70 to-green-900/50',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
  },
];

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'foryou',    label: 'For You'    },
  { id: 'live',      label: '🔴 Live'    },
  { id: 'trending',  label: '🔥 Trending' },
  { id: 'gaming',    label: 'Gaming'     },
  { id: 'music',     label: 'Music'      },
  { id: 'dance',     label: 'Dance'      },
  { id: 'talk',      label: 'Talk Shows' },
];

// ─── Auth Gate Modal Removed ───────────────────────────────────────────────────
// We now use the global AuthModal via useAuthModalStore.


// ─── Top Navigation ───────────────────────────────────────────────────────────
function ExploreTopNav({
  search, onSearch, onGateAction, activeTab, onTabChange,
}: {
  search: string;
  onSearch: (v: string) => void;
  onGateAction: (a: string) => void;
  activeTab: string;
  onTabChange: (t: string) => void;
}) {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-50 bg-[#090909]/95 backdrop-blur-xl border-b border-white/[0.06]">
      {/* Main row */}
      <div className="max-w-[1440px] mx-auto h-14 flex items-center gap-3 px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/30">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="hidden sm:block text-base font-black tracking-tight text-white font-heading">LiveHub</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search creators, streams…"
            className="w-full h-9 pl-8 pr-4 bg-white/[0.05] border border-white/[0.08] rounded-full text-xs text-white placeholder-zinc-600 outline-none focus:border-primary/40 focus:bg-white/[0.07] transition-all"
          />
        </div>

        {/* Desktop tab bar */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'following' && !user) { onGateAction('access your Following tab'); return; }
                onTabChange(tab.id);
              }}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
          {user ? (
            <>
              <button
                onClick={() => onGateAction('manage your Coins')}
                className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition"
              >
                <Coins className="h-3.5 w-3.5 text-yellow-400" />
                <span>0</span>
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition">
                <Bell className="h-4 w-4 text-zinc-400" />
              </button>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-transparent hover:ring-primary/30 transition-all cursor-pointer">
                {user.username[0].toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:block text-xs font-semibold text-zinc-300 hover:text-white transition px-3 py-1.5 rounded-full hover:bg-white/[0.06]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1.5 h-8 px-4 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/25"
              >
                <Zap className="h-3.5 w-3.5" />
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile tab scroll */}
      <div className="lg:hidden overflow-x-auto hide-scrollbar px-4 pb-2">
        <div className="flex items-center gap-1.5">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-primary text-white shadow shadow-primary/20'
                  : 'bg-white/[0.05] border border-white/[0.08] text-zinc-400 hover:text-white'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ─── Creator Card ─────────────────────────────────────────────────────────────
function CreatorCard({ c, onGate }: { c: Creator; onGate: (a: string) => void }) {
  const { user } = useAuthStore();
  const [hovered, setHovered] = useState(false);
  const [liked, setLiked] = useState(false);
  const [followed, setFollowed] = useState(false);

  const guard = (action: string, fn?: () => void) => {
    if (!user) { onGate(action); } else { fn?.(); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group rounded-2xl overflow-hidden bg-[#111111] border border-white/[0.06] hover:border-primary/25 transition-colors duration-300 cursor-pointer"
    >
      {/* Thumbnail area */}
      <div className="relative overflow-hidden">
        <img
          src={c.thumbnail}
          alt={c.displayName}
          loading="lazy"
          className={cn(
            'w-full object-cover transition-transform duration-700',
            c.tall ? 'aspect-[9/14]' : 'aspect-[3/4]',
            hovered ? 'scale-110' : 'scale-100'
          )}
        />

        {/* Hover tint overlay */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn('absolute inset-0 bg-gradient-to-t', c.accent)}
            />
          )}
        </AnimatePresence>

        {/* Always-visible bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between">
          {c.isLive ? (
            <span className="flex items-center gap-1 bg-primary px-2 py-0.5 rounded-md text-[10px] font-black text-white tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          ) : (
            <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-bold text-zinc-300">
              <Play className="h-2.5 w-2.5" />
              VIDEO
            </span>
          )}
          <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-semibold text-white">
            <Eye className="h-2.5 w-2.5 text-white/70" />
            {c.viewers}
          </span>
        </div>

        {/* Hover play button */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="h-14 w-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25">
                {c.isLive
                  ? <Radio className="h-6 w-6 text-white" />
                  : <Play className="h-6 w-6 text-white translate-x-0.5" />
                }
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Side action buttons (appear on hover) */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.18 }}
              className="absolute right-2.5 bottom-16 flex flex-col items-center gap-2"
            >
              {/* Like */}
              <button
                onClick={e => { e.stopPropagation(); guard('like streams', () => setLiked(!liked)); }}
                className="flex flex-col items-center"
              >
                <div className={cn(
                  'h-9 w-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all',
                  liked && user ? 'bg-primary/30 border-primary' : 'bg-black/40 border-white/20 hover:bg-primary/20'
                )}>
                  <Heart className={cn('h-4 w-4', liked && user ? 'text-primary fill-primary' : 'text-white')} />
                </div>
                <span className="text-[9px] text-white/60 mt-0.5">{c.likes}</span>
              </button>

              {/* Gift */}
              <button
                onClick={e => { e.stopPropagation(); guard('send gifts to creators'); }}
                className="flex flex-col items-center"
              >
                <div className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-yellow-500/20 hover:border-yellow-400/40 transition-all">
                  <Gift className="h-4 w-4 text-white" />
                </div>
                <span className="text-[9px] text-white/60 mt-0.5">Gift</span>
              </button>

              {/* Follow */}
              <button
                onClick={e => { e.stopPropagation(); guard('follow creators', () => setFollowed(!followed)); }}
                className="flex flex-col items-center"
              >
                <div className={cn(
                  'h-9 w-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all',
                  followed && user ? 'bg-primary/30 border-primary' : 'bg-black/40 border-white/20 hover:bg-primary/20'
                )}>
                  <UserPlus className={cn('h-4 w-4', followed && user ? 'text-primary' : 'text-white')} />
                </div>
                <span className="text-[9px] text-white/60 mt-0.5">Follow</span>
              </button>

              {/* Share */}
              <button
                onClick={e => { e.stopPropagation(); guard('share creator profiles'); }}
                className="flex flex-col items-center"
              >
                <div className="h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/10 transition-all">
                  <Share2 className="h-4 w-4 text-white" />
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Creator info row at bottom of thumbnail */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-end gap-2">
          <img
            src={c.avatar}
            alt={c.displayName}
            className="h-8 w-8 rounded-full border-2 border-white/20 object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-white truncate">{c.displayName}</span>
              {c.verified && <BadgeCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
            </div>
            <span className="text-[10px] text-white/55">{c.followers}</span>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-3 py-2.5">
        <p className="text-xs font-semibold text-white/90 line-clamp-1 mb-1.5">{c.title}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-zinc-500 bg-white/[0.04] border border-white/[0.05] px-2 py-0.5 rounded-full">
            {c.category}
          </span>
          <button
            onClick={() => guard('save streams')}
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/[0.06] transition"
          >
            <Bookmark className="h-3 w-3 text-zinc-600 hover:text-zinc-300" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Guest Banner ─────────────────────────────────────────────────────────────
function GuestBanner({ onJoin }: { onJoin: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/5 to-transparent border border-primary/20 mb-6"
    >
      <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Zap className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">Guest Mode</p>
        <p className="text-xs text-zinc-500 truncate">Browse freely. Sign up to chat, send gifts & follow creators.</p>
      </div>
      <button
        onClick={onJoin}
        className="flex-shrink-0 px-4 py-1.5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition shadow-lg shadow-primary/20"
      >
        Join Free
      </button>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const { user } = useAuthStore();
  const { openModal } = useAuthModalStore();
  const [activeTab, setActiveTab] = useState('foryou');
  const [search, setSearch] = useState('');

  const triggerGate = useCallback((action: string) => {
    if (!user) openModal(action);
  }, [user, openModal]);

  // ── Filter logic
  const cards = CREATORS.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      return (c.displayName + c.username + c.title + c.category).toLowerCase().includes(q);
    }
    switch (activeTab) {
      case 'live':     return c.isLive;
      case 'trending': return parseInt(c.viewers.replace(/[^\d]/g, '')) > 5000;
      case 'gaming':   return c.category === 'Gaming';
      case 'music':    return c.category === 'Music';
      case 'dance':    return c.category === 'Dance';
      case 'talk':     return c.category === 'Talk Show';
      default:         return true;
    }
  });

  return (
    <div className="min-h-screen bg-[#090909] text-white">
      {/* Auth modal (Google / Apple / Email) */}
      <AuthModal />

      {/* Standalone top nav */}
      <ExploreTopNav
        search={search}
        onSearch={setSearch}
        onGateAction={triggerGate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Page content */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 py-5">

        {/* Guest mode banner */}
        {!user && (
          <GuestBanner onJoin={() => triggerGate('join LiveHub')} />
        )}

        {/* Live count chip */}
        <div className="flex items-center gap-2 mb-5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            {cards.filter(c => c.isLive).length} streams live right now
          </span>
          <div className="h-px flex-1 bg-white/[0.05]" />
          <span className="text-xs text-zinc-600">{cards.length} creators</span>
        </div>

        {/* Empty state */}
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-600">
            <Search className="h-14 w-14 mb-4 opacity-15" />
            <p className="text-sm font-medium">No results for "{search}"</p>
            <button onClick={() => setSearch('')} className="mt-3 text-xs text-primary hover:underline">
              Clear search
            </button>
          </div>
        )}

        {/* ── Masonry grid (CSS columns) ── */}
        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3">
          {cards.map((c, i) => (
            <div key={c.id} className="break-inside-avoid mb-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 260, damping: 20 }}
              >
                <CreatorCard c={c} onGate={triggerGate} />
              </motion.div>
            </div>
          ))}
        </div>

        {/* Bottom load more hint */}
        {cards.length > 0 && (
          <div className="flex flex-col items-center gap-3 py-14">
            <div className="flex items-center gap-3 text-zinc-700 text-xs">
              <div className="h-px w-16 bg-white/[0.05]" />
              Showing all {cards.length} creators
              <div className="h-px w-16 bg-white/[0.05]" />
            </div>
            {!user && (
              <Link
                href="/register"
                className="inline-flex items-center gap-2 mt-1 px-6 py-2.5 rounded-full bg-white/[0.05] border border-white/10 text-sm font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition"
              >
                <Zap className="h-4 w-4 text-primary" />
                Sign up to unlock everything
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Floating CTA — mobile, guests only */}
      {!user && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden"
        >
          <Link
            href="/register"
            className="flex items-center gap-2 px-7 py-3.5 rounded-full bg-primary text-white text-sm font-bold shadow-2xl shadow-primary/40 border border-primary/20"
          >
            <Zap className="h-4 w-4" />
            Join Free
          </Link>
        </motion.div>
      )}
    </div>
  );
}
