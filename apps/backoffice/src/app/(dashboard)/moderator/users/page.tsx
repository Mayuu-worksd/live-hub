'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { Users } from 'lucide-react';

interface UserRow {
  id: string;
  username: string;
  email: string;
  role: string;
  is_banned: boolean;
  is_verified: boolean;
  created_at: string;
}

export default function ModeratorUsers() {
  const [data, setData] = React.useState<UserRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();
  const [query, setQuery] = React.useState('');

  const fetchData = async (q = '') => {
    try {
      setIsLoading(true);
      setError(undefined);
      const res = await fetch(`/api/admin/users-list?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      setData(json.data ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => { fetchData(); }, []);

  const columns: Column<UserRow>[] = [
    { header: 'Username', cell: (row) => <span className="text-white font-medium">@{row.username}</span> },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Role', accessorKey: 'role' },
    { header: 'Status', cell: (row) => (
      <span className={row.is_banned ? 'text-rose-400' : 'text-emerald-400'}>
        {row.is_banned ? 'Banned' : 'Active'}
      </span>
    )},
    { header: 'Verified', cell: (row) => row.is_verified ? <span className="text-violet-400">Yes</span> : <span className="text-zinc-500">No</span> },
    { header: 'Joined', cell: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Users" />
      <div className="p-8">
        <div className="mb-4">
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); fetchData(e.target.value); }}
            placeholder="Search by email or username…"
            className="w-full max-w-md h-10 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm text-white placeholder:text-zinc-600 focus:outline-none"
          />
        </div>
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRetry={() => fetchData(query)}
          emptyState={{
            icon: Users,
            title: 'No users found',
            description: 'Registered users will appear here.',
          }}
        />
      </div>
    </div>
  );
}
