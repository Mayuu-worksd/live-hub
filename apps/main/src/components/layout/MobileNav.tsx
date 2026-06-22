'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Radio, MessageCircle, User, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const isCreator = user?.role === 'creator' || user?.role === 'verified_creator';

  const tabs = isCreator
    ? [
        { href: '/home', label: 'Home', icon: Home },
        { href: '/creator/studio', label: 'Go Live', icon: Radio, highlight: true },
        { href: '/creator/dashboard', label: 'Dashboard', icon: TrendingUp },
        { href: '/messages', label: 'Messages', icon: MessageCircle },
        { href: '/profile/me', label: 'Profile', icon: User },
      ]
    : [
        { href: '/home', label: 'Home', icon: Home },
        { href: '/messages', label: 'Messages', icon: MessageCircle },
        { href: '/profile/me', label: 'Profile', icon: User },
      ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/95 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <Link key={tab.href} href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200',
                'highlight' in tab && tab.highlight && !isActive && 'text-violet',
                isActive && !('highlight' in tab && tab.highlight) && 'text-white',
                !isActive && !('highlight' in tab && tab.highlight) && 'text-zinc-500'
              )}>
              {'highlight' in tab && tab.highlight ? (
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-full transition-all', isActive ? 'bg-violet shadow-lg shadow-violet/25' : 'bg-violet/15')}>
                  <tab.icon className="h-5 w-5 text-white" />
                </div>
              ) : (
                <tab.icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-white' : 'text-zinc-500')} />
              )}
              <span className={cn('text-[10px] font-medium', isActive ? 'text-white' : 'text-zinc-500')}>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
