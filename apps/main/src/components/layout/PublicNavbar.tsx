'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, Bell, Coins, Radio, LogOut, Compass } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useWalletStore } from '@/stores/useWalletStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { cn } from '@/lib/utils/cn';
import { SearchComponent } from './SearchComponent';

export function PublicNavbar() {
  const router = useRouter();
  const { user, clearUser, isLoading } = useAuthStore();
  const { coinBalance } = useWalletStore();
  const { unreadCount } = useNotificationStore();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    document.cookie = 'livehub_session=; Max-Age=0; path=/';
    document.cookie = 'livehub_role=; Max-Age=0; path=/';
    document.cookie = 'livehub_onboarded=; Max-Age=0; path=/';
    clearUser();
    router.push('/');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#131313]/80 backdrop-blur-xl border-b border-white/[0.06]"
    >
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-6">
        <Link href="/home" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold font-heading tracking-tight text-white">LiveHub</span>
        </Link>

        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SearchComponent />
        </div>

        {/* Explore shortcut for guests */}
        {!user && !isLoading && (
          <Link
            href="/explore"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
            Explore
          </Link>
        )}

        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin mr-2" />
          ) : user ? (
            <>
              <Link href="/wallet"
                className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/[0.05] border border-white/[0.08] text-sm font-medium text-zinc-300 hover:bg-white/[0.08] transition-colors">
                <Coins className="h-3.5 w-3.5 text-gold" />
                <span>{coinBalance.toLocaleString()}</span>
              </Link>
              <Link href="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
                <Bell className="h-4 w-4 text-zinc-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-live border-2 border-[#131313] flex items-center justify-center text-[8px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link href="/profile/me"
                className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-semibold text-white ring-2 ring-transparent hover:ring-primary/30 transition-all"
                title="View Profile">
                {user.username[0].toUpperCase()}
              </Link>
              <button onClick={handleSignOut}
                className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-white/[0.08] transition-colors"
                title="Sign out">
                <LogOut className="h-4 w-4 text-zinc-400 hover:text-white" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors">Sign In</Link>
              <Link href="/register" className="px-5 py-2 rounded-full text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
