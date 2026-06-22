'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Role = 'agency_manager' | 'agency' | 'moderator' | 'admin' | 'super_admin' | 'unknown';

type NavItem =
  | { type: 'link'; name: string; href: string; indent?: boolean }
  | { type: 'section'; name: string };

const SUPER_ADMIN_LINKS: NavItem[] = [
  { type: 'link', name: 'Staff Management', href: '/super-admin/staff' },
  { type: 'link', name: 'Audit Logs', href: '/super-admin/audit' },
  { type: 'link', name: 'Finance Config', href: '/super-admin/finance' },
  { type: 'link', name: 'Settings', href: '/super-admin/settings' },
];

const ADMIN_LINKS: NavItem[] = [
  { type: 'link', name: 'Users', href: '/admin/users' },
  { type: 'link', name: 'Creators', href: '/admin/creators' },
  { type: 'link', name: 'Reports', href: '/admin/reports' },
  { type: 'link', name: 'Verification', href: '/admin/verification' },
  { type: 'section', name: 'Finance' },
  { type: 'link', name: 'Overview', href: '/admin/finance', indent: true },
  { type: 'link', name: 'Pending Payouts', href: '/admin/revenue', indent: true },
  { type: 'link', name: 'Withdrawals', href: '/admin/finance/withdrawals', indent: true },
  { type: 'link', name: 'Coin Packages', href: '/admin/finance/coins', indent: true },
  { type: 'link', name: 'Gift Catalog', href: '/admin/finance/gifts', indent: true },
  { type: 'link', name: 'Subscriptions', href: '/admin/finance/subscriptions', indent: true },
  { type: 'section', name: 'Admin' },
  { type: 'link', name: 'Settings', href: '/admin/settings' },
];

const MODERATOR_LINKS: NavItem[] = [
  { type: 'link', name: 'Reports Queue', href: '/moderator/queue' },
  { type: 'link', name: 'Live Streams', href: '/moderator/streams' },
  { type: 'link', name: 'Users', href: '/moderator/users' },
  { type: 'link', name: 'Chat', href: '/moderator/chat' },
];

const AGENCY_LINKS: NavItem[] = [
  { type: 'link', name: 'Overview', href: '/agency/overview' },
  { type: 'link', name: 'Creators', href: '/agency/creators' },
  { type: 'link', name: 'Analytics', href: '/agency/analytics' },
  { type: 'link', name: 'Revenue', href: '/agency/revenue' },
  { type: 'link', name: 'Payouts', href: '/agency/payouts' },
  { type: 'link', name: 'Financials', href: '/agency/financials' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<Role>('unknown');

  useEffect(() => {
    const roleCookie = document.cookie.split(';').find((c) => c.trim().startsWith('livehub_role='));
    if (roleCookie) setRole(roleCookie.split('=')[1].trim() as Role);
  }, []);

  let items: NavItem[] = [];
  if (role === 'super_admin') items = [...SUPER_ADMIN_LINKS, ...ADMIN_LINKS, ...MODERATOR_LINKS];
  else if (role === 'admin') items = [...ADMIN_LINKS, ...MODERATOR_LINKS];
  else if (role === 'moderator') items = MODERATOR_LINKS;
  else if (role === 'agency_manager' || role === 'agency') items = AGENCY_LINKS;

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    document.cookie = 'livehub_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'livehub_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/auth/login');
  };

  return (
    <div className="w-[260px] bg-[#1A1A1A] border-r border-white/[0.06] min-h-screen flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-white/[0.06]">
        <h2 className="text-xl font-bold font-heading text-white tracking-tight">LiveHub</h2>
        <p className="text-xs text-neutral-500 uppercase mt-1">{role.replace(/_/g, ' ')} Portal</p>
      </div>
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {items.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <p key={`section-${idx}`} className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                {item.name}
              </p>
            );
          }
          const isActive = pathname === item.href || (item.href !== '/admin/finance' && pathname.startsWith(`${item.href}/`));
          return (
            <Link
              key={item.href + item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors mb-0.5 ${
                item.indent ? 'pl-6' : ''
              } ${
                isActive ? 'bg-primary/10 text-primary' : 'text-neutral-400 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              {item.indent && <span className="mr-1.5 text-neutral-700">·</span>}
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/[0.06]">
        <button
          onClick={signOut}
          className="block w-full text-center px-4 py-2 text-sm text-neutral-400 hover:text-white hover:bg-white/[0.05] rounded-md transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
