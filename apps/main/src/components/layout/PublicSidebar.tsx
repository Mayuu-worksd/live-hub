'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Radio, MessageCircle, User, TrendingUp, Gamepad2, Music, Mic, Heart, Video } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';

const viewerNav = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile/me', label: 'Profile', icon: User },
];

const creatorNav = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/creator/studio', label: 'Go Live', icon: Radio, highlight: true },
  { href: '/creator/content', label: 'Content Hub', icon: Video },
  { href: '/creator/dashboard', label: 'Dashboard', icon: TrendingUp },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/profile/me', label: 'Profile', icon: User },
];

const categories = [
  { label: 'Gaming', icon: Gamepad2 },
  { label: 'Music', icon: Music },
  { label: 'Talk Shows', icon: Mic },
  { label: 'Dance', icon: Heart },
];

export function PublicSidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isCreator = user?.role === 'creator' || user?.role === 'verified_creator';
  const nav = isCreator ? creatorNav : viewerNav;

  return (
    <aside className="peer hidden md:flex fixed left-0 top-16 bottom-0 w-[72px] hover:w-[280px] group transition-all duration-300 ease-in-out z-40 flex-col border-r border-white/[0.06] bg-[#0F0F0F] overflow-hidden">
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 hide-scrollbar">
        <div className="space-y-1">
          {nav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full',
                  isActive ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                )}>
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary')} />
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {item.label}
                </span>
                {!!(item as any).highlight && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-live animate-live-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 border-t border-white/[0.04] pt-6">
          <h3 className="px-3 mb-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <Link key={cat.label} href={`/home?cat=${cat.label.toLowerCase()}`}
                className="flex items-center px-3 py-3 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-all duration-200 w-full">
                <cat.icon className="h-5 w-5 flex-shrink-0" />
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-white/[0.04] whitespace-nowrap">
        <p className="text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-center">
          LiveHub &copy; 2026
        </p>
      </div>
    </aside>
  );
}
