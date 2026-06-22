'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export function ViewerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <Navbar />
      <Sidebar />
      <main className="pt-16 md:pl-[240px] pb-20 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
