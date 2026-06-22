'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { Users } from 'lucide-react';

interface CreatorRow {
  id: string;
  name: string;
  status: string;
  followers: number;
  periodEarnings: string;
}

export default function AgencyCreators() {
  const [data, setData] = React.useState<CreatorRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const res = await fetch('/api/backoffice/agency/creators');
      if (!res.ok) throw new Error('Failed to fetch creators');
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const columns: Column<CreatorRow>[] = [
    { header: 'Creator Name', accessorKey: 'name' },
    { header: 'Status', accessorKey: 'status' },
    { header: 'Total Followers', accessorKey: 'followers' },
    { header: 'Period Earnings', accessorKey: 'periodEarnings' },
    { header: 'Actions', cell: () => <span className="text-blue-500 cursor-pointer hover:underline">Manage</span> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header 
        title="Creators" 
        actions={
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Invite Creator
          </button>
        }
      />
      <div className="p-8">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRetry={fetchData}
          emptyState={{
            icon: Users,
            title: 'No creators assigned yet',
            description: 'Use the "Invite Creator" button to start building your roster.',
            action: {
              label: 'Invite Creator',
              onClick: () => alert('Invite Creator Modal (Stub)'),
            }
          }}
        />
      </div>
    </div>
  );
}
