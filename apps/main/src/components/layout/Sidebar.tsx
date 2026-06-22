'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  Compass,
  Radio,
  MessageCircle,
  User,
  TrendingUp,
  Gamepad2,
  Music,
  Mic,
  Heart,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const mainNav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/studio', label: 'Go Live', icon: Radio },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile/me', label: 'Profile', icon: User },
  { href: '/creator-dashboard', label: 'Dashboard', icon: TrendingUp },
];

const categories = [
  { label: 'Trending', icon: TrendingUp },
  { label: 'Gaming', icon: Gamepad2 },
  { label: 'Music', icon: Music },
  { label: 'Talk Shows', icon: Mic },
  { label: 'Dance', icon: Heart },
];

const topCreators = [
  { name: 'SophiaLive', viewers: '12.4K', isLive: true },
  { name: 'DJ_Rhythm', viewers: '8.2K', isLive: true },
  { name: 'GamerPro99', viewers: '6.7K', isLive: true },
  { name: 'DanceQueen', viewers: '5.1K', isLive: false },
  { name: 'TalkWithSam', viewers: '4.3K', isLive: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'hidden md:flex fixed left-0 top-16 bottom-0 w-[280px] z-40',
        'flex-col border-r border-white/[0.06]',
        'bg-[#1A1A1A]'
      )}
    >
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                  'transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-primary')} />
                {item.label}
                {item.label === 'Go Live' && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-live animate-live-pulse" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Categories */}
        <div className="mt-8">
          <h3 className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            Categories
          </h3>
          <div className="space-y-0.5">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                href={`/explore?cat=${cat.label.toLowerCase()}`}
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all duration-200"
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Top Creators */}
        <div className="mt-8">
          <h3 className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            Top Creators
          </h3>
          <div className="space-y-1">
            {topCreators.map((creator, i) => (
              <motion.div
                key={creator.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/profile/${creator.name}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.03] transition-colors duration-200"
                >
                  <div className="relative">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/60 to-secondary/60 flex items-center justify-center text-[10px] font-semibold text-white">
                      {creator.name[0]}
                    </div>
                    {creator.isLive && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-live border border-[#1A1A1A]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-300 truncate">{creator.name}</p>
                  </div>
                  {creator.isLive && (
                    <span className="text-[10px] text-zinc-500">{creator.viewers}</span>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.04]">
        <p className="text-[10px] text-zinc-600 text-center">
          LiveHub &copy; 2026 &middot; All rights reserved
        </p>
      </div>
    </aside>
  );
}
