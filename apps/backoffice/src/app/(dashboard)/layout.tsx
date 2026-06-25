'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const ALLOWED_ROLES = ['admin', 'super_admin', 'agency_manager', 'agency', 'moderator'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const role = cookies.find((c) => c.trim().startsWith('livehub_role='))?.split('=')[1]?.trim();

    if (!role) { router.replace('/auth/login'); return; }
    if (!ALLOWED_ROLES.includes(role)) { router.replace('/unauthorized'); return; }

    setReady(true);
  }, [router]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!ready) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-950">
      {/* Mobile hamburger */}
      <button
        className="absolute top-4 left-4 md:hidden p-2 rounded-md bg-neutral-800 text-white hover:bg-neutral-700 transition"
        onClick={toggleSidebar}
        aria-label="Toggle navigation"
      >
        {/* Simple three-bar icon */}
        <svg viewBox="0 0 100 80" width="24" height="24" fill="currentColor">
          <rect width="100" height="12"></rect>
          <rect y="30" width="100" height="12"></rect>
          <rect y="60" width="100" height="12"></rect>
        </svg>
      </button>

      {/* Sidebar – hidden on mobile unless opened */}
      <div
        className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 w-[260px] bg-[#1A1A1A] border-r border-white/[0.06] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex`}
      >
        <Sidebar />
      </div>

      {/* Overlay for mobile when sidebar open */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
