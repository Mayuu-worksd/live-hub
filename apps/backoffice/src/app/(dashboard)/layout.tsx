'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const ALLOWED_ROLES = ['admin', 'super_admin', 'agency_manager', 'agency', 'moderator'];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const role = cookies.find((c) => c.trim().startsWith('livehub_role='))?.split('=')[1]?.trim();

    if (!role) { router.replace('/auth/login'); return; }
    if (!ALLOWED_ROLES.includes(role)) { router.replace('/unauthorized'); return; }

    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
