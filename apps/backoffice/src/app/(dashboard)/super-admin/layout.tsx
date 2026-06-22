'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const role = document.cookie.split(';')
      .find((c) => c.trim().startsWith('livehub_role='))?.split('=')[1]?.trim();
    if (role !== 'super_admin') { router.replace('/unauthorized'); return; }
    setReady(true);
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
