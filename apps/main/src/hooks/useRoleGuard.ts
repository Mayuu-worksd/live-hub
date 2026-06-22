'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import type { UserRole } from '@/types/user';

export function useRoleGuard(allowed: UserRole[]) {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!allowed.includes(user.role)) router.replace('/home');
  }, [user, isLoading, router, allowed]);

  return { user, isLoading };
}
