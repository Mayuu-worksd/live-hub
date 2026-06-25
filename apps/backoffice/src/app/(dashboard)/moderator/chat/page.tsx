'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface ChatRow {
  id: string;
  stream_id: string;
  user_id: string;
  content: string;
  type: string;
  created_at: string;
}

export default function ModeratorChat() {
  const [data, setData] = React.useState<ChatRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const { data: rows, error: err } = await supabase
        .from('stream_messages')
        .select('id, stream_id, user_id, content, type, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
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
      .channel('mod-chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stream_messages' }, (payload) => {
        setData((prev) => [payload.new as ChatRow, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const columns: Column<ChatRow>[] = [
    { header: 'Time', cell: (row) => new Date(row.created_at).toLocaleString() },
    { header: 'Stream ID', cell: (row) => row.stream_id.slice(0, 8) + '...' },
    { header: 'User ID', cell: (row) => row.user_id.slice(0, 8) + '...' },
    { header: 'Type', accessorKey: 'type' },
    { header: 'Message', cell: (row) => <span className="max-w-xs truncate block">{row.content}</span> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Stream Chat Monitor" />
      <div className="p-8">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRetry={fetchData}
          emptyState={{
            icon: MessageSquare,
            title: 'No chat messages',
            description: 'Stream chat messages will appear here in real-time.',
          }}
        />
      </div>
    </div>
  );
}
