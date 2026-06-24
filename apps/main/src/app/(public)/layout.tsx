'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { PublicSidebar } from '@/components/layout/PublicSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { cn } from '@/lib/utils/cn';

const AUTH_PAGES = ['/login', '/register'];
const PUBLIC_PAGES = ['/login', '/register'];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isPublicPage = PUBLIC_PAGES.includes(pathname);

  useEffect(() => {
    if (isLoading) return;

    const searchParams = new URLSearchParams(window.location.search);
    const redirect = searchParams.get('redirect') || '/home';
    const isOnboarding = pathname === '/onboarding';

    if (!user) {
      if (!isPublicPage && !isOnboarding) {
        const dest = pathname === '/home' ? '/register' : '/login';
        router.replace(`${dest}?redirect=${encodeURIComponent(pathname)}`);
      }
      return;
    }

    // User is logged in
    if (isAuthPage) {
      // Already logged in, don't show login/register
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
  }, [user, isLoading, router, pathname, isAuthPage]);

  // Auth pages never need a guard or navbar
  if (isAuthPage) return <>{children}</>;

  // Show spinner while auth resolves — never a blank white/black screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const isOnboarding = pathname === '/onboarding';
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
