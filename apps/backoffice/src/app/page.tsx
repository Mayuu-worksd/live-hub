'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BackofficeRoot() {
  const router = useRouter();

  useEffect(() => {
    const cookies = document.cookie.split(';');
    const roleCookie = cookies.find((c) => c.trim().startsWith('livehub_role='));
    const role = roleCookie?.split('=')[1]?.trim();

    if (!role) { router.replace('/auth/login'); return; }

    if (role === 'super_admin') router.replace('/super-admin');
    else if (role === 'admin') router.replace('/admin');
    else if (role === 'moderator') router.replace('/moderator');
    else if (role === 'agency_manager' || role === 'agency') router.replace('/agency');
    else router.replace('/unauthorized');
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
    </div>
  );
}
