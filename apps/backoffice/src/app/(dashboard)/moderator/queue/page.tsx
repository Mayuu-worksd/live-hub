'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { Flag } from 'lucide-react';
import { createSupabaseBrowserClient } from '@livehub/shared';

interface ReportRow {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  status: string;
  created_at: string;
}

export default function ModeratorQueue() {
  const [data, setData] = React.useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();
  const supabase = createSupabaseBrowserClient();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const res = await fetch('/api/backoffice/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
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

    // Subscribe to realtime changes on the 'reports' table
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => [payload.new as ReportRow, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) => (item.id === payload.new.id ? (payload.new as ReportRow) : item))
            );
          } else if (payload.eventType === 'DELETE') {
            setData((prev) => prev.filter((item) => item.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const columns: Column<ReportRow>[] = [
    { header: 'Report ID', cell: (row) => row.id.slice(0, 8) + '...' },
    { header: 'Timestamp', cell: (row) => new Date(row.created_at).toLocaleString() },
    { header: 'Reporter ID', cell: (row) => row.reporter_id.slice(0, 8) + '...' },
    { header: 'Target ID', cell: (row) => row.reported_id.slice(0, 8) + '...' },
    { header: 'Reason', accessorKey: 'reason' },
    { header: 'Status', cell: (row) => <span className="capitalize">{row.status}</span> },
    { header: 'Actions', cell: () => <span className="text-blue-500 cursor-pointer hover:underline">Review</span> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Reports Queue" />
      <div className="p-8">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRetry={fetchData}
          emptyState={{
            icon: Flag,
            title: 'No active reports',
            description: 'The community is safe and quiet. When users report content, it will appear in this queue.',
          }}
        />
      </div>
    </div>
  );
}
