'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { Radio } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface StreamRow {
  id: string;
  title: string;
  status: string;
  viewer_count: number;
  category: string;
  started_at: string | null;
  host_id: string;
}

export default function ModeratorStreams() {
  const [data, setData] = React.useState<StreamRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const { data: rows, error: err } = await supabase
        .from('streams')
        .select('id, title, status, viewer_count, category, started_at, host_id')
        .order('started_at', { ascending: false })
        .limit(50);
      if (err) throw new Error(err.message);
      setData(rows ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('mod-streams')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'streams' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const columns: Column<StreamRow>[] = [
    { header: 'Title', accessorKey: 'title' },
    { header: 'Category', accessorKey: 'category' },
    { header: 'Status', cell: (row) => <span className={`capitalize ${row.status === 'live' ? 'text-emerald-400' : 'text-zinc-400'}`}>{row.status}</span> },
    { header: 'Viewers', accessorKey: 'viewer_count' },
    { header: 'Started At', cell: (row) => row.started_at ? new Date(row.started_at).toLocaleString() : '—' },
    { header: 'Actions', cell: () => <span className="text-blue-500 cursor-pointer hover:underline">Monitor</span> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Live Streams" />
      <div className="p-8">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRetry={fetchData}
          emptyState={{
            icon: Radio,
            title: 'No streams found',
            description: 'Active and past streams will appear here.',
          }}
        />
      </div>
    </div>
  );
}
