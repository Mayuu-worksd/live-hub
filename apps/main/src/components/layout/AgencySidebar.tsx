'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, DollarSign, BarChart2, ArrowDownToLine, LogOut, Radio, Briefcase } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';

const nav = [
  { href: '/agency', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/agency/creators', label: 'Creators', icon: Users },
  { href: '/agency/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/agency/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/agency/payouts', label: 'Payouts', icon: ArrowDownToLine },
];

export function AgencySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useAuthStore();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    ['livehub_session', 'livehub_role', 'livehub_onboarded'].forEach(
      (c) => (document.cookie = `${c}=; Max-Age=0; path=/`)
    );
    clearUser();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] z-40 flex flex-col border-r border-white/[0.06] bg-[#0a0a0d]">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/[0.06]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan/20">
          <Radio className="h-4 w-4 text-cyan" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">LiveHub</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Agency</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive ? 'bg-cyan/10 text-cyan' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              )}>
              <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-cyan')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan/60 to-violet/60 flex items-center justify-center text-xs font-bold text-white">
            {user?.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">@{user?.username}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Briefcase className="h-2.5 w-2.5 text-cyan" />
              <p className="text-[10px] text-zinc-500">Agency Manager</p>
            </div>
          </div>
        </div>
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-rose hover:bg-rose/5 transition-all">
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
