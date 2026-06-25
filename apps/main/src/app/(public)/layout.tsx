'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicSidebar } from '@/components/layout/PublicSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils/cn';

const AUTH_PAGES = ['/login', '/register'];

// Pages fully accessible without any account
const isGuestAllowed = (path: string) =>
  AUTH_PAGES.includes(path) || path === '/explore' || path.startsWith('/explore/') || path.startsWith('/live/') || path.startsWith('/profile/');

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isPublicPage = isGuestAllowed(pathname);

  useEffect(() => {
    if (isLoading) return;

    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect') || '/home';
    const isOnboarding = pathname === '/onboarding';

    if (!user) {
      // Guest on a protected page → send to register (for /home) or login
      if (!isPublicPage && !isOnboarding) {
        const dest = pathname === '/home' ? '/register' : '/login';
        router.replace(`${dest}?redirect=${encodeURIComponent(pathname)}`);
      }
      // Guest on a public page (/explore, /login, /register) → just let it render
      return;
    }

    // User is logged in
    if (isAuthPage) {
      router.replace(user.onboarding_completed ? (redirect || '/home') : '/onboarding');
      return;
    }

    if (!user.onboarding_completed && !isOnboarding) {
      router.replace('/onboarding');
      return;
    }

    if (user.onboarding_completed && isOnboarding) {
      router.replace('/home');
    }
  }, [user, isLoading, router, pathname, isAuthPage, isPublicPage]);

  // Auth pages never need a guard or navbar
  if (isAuthPage) return <>{children}</>;

  // Explore page is fully standalone — it has its own nav, no sidebar
  if (pathname === '/explore' || pathname.startsWith('/explore/')) return <>{children}</>;

  // Show spinner while auth resolves — never a blank white/black screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const isOnboarding = pathname === '/onboarding';
  // Unauthenticated users on recognised public pages still get the full layout
  if (!user && !isPublicPage && !isOnboarding) return null;

  // Onboarding screen — no nav/sidebar
  if (user && !user.onboarding_completed) return <>{children}</>;

  const isLivePage = pathname.startsWith('/live/');

  return (
    <div className={cn("min-h-screen bg-[#0F0F0F]", isLivePage && "h-screen overflow-hidden")}>
      <PublicNavbar />
      <PublicSidebar />
      <main className={cn(
        "pt-16 pb-20 md:pb-0 md:pl-[72px] peer-hover:md:pl-[280px] transition-all duration-300",
        isLivePage && "h-[calc(100vh-4rem)] overflow-hidden"
      )}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
