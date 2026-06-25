'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { ShieldCheck } from 'lucide-react';

interface StaffRow {
  id: string;
  username: string;
  email: string;
  role: string;
  is_banned: boolean;
  created_at: string;
}

export default function SuperAdminStaff() {
  const [data, setData] = React.useState<StaffRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const res = await fetch('/api/admin/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      const json = await res.json();
      setData(json.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => { fetchData(); }, []);

  const columns: Column<StaffRow>[] = [
    { header: 'Username', cell: (row) => <span className="text-white font-medium">@{row.username}</span> },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Role', cell: (row) => <span className="capitalize text-violet-400">{row.role.replace('_', ' ')}</span> },
    { header: 'Status', cell: (row) => <span className={row.is_banned ? 'text-rose-400' : 'text-emerald-400'}>{row.is_banned ? 'Banned' : 'Active'}</span> },
    { header: 'Joined', cell: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Staff Management" />
      <div className="p-8">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRetry={fetchData}
          emptyState={{
            icon: ShieldCheck,
            title: 'No staff members found',
            description: 'Admin, moderator and agency staff accounts will appear here.',
          }}
        />
      </div>
    </div>
  );
}
