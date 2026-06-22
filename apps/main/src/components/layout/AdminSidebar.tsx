'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, BadgeCheck, DollarSign, Flag, Settings, LogOut, Radio, Shield } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { cn } from '@/lib/utils/cn';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/creators', label: 'Creators', icon: BadgeCheck },
  { href: '/admin/revenue', label: 'Revenue', icon: DollarSign },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
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
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet">
          <Radio className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">LiveHub</p>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive ? 'bg-violet/10 text-violet-light' : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
              )}>
              <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-violet')} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="p-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet/60 to-cyan/60 flex items-center justify-center text-xs font-bold text-white">
            {user?.username[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">@{user?.username}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="h-2.5 w-2.5 text-violet" />
              <p className="text-[10px] text-zinc-500 capitalize">{user?.role.replace('_', ' ')}</p>
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
