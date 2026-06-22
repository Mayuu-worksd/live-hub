'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { Banknote } from 'lucide-react';
import { createSupabaseBrowserClient } from '@livehub/shared';

interface WithdrawalRow {
  id: string;
  user_id?: string;
  creator?: string;
  diamond_amount?: number;
  amount?: string;
  payment_method?: string;
  method?: string;
  created_at?: string;
  date?: string;
  status: string;
}

export default function AdminWithdrawals() {
  const [data, setData] = React.useState<WithdrawalRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();
  const supabase = createSupabaseBrowserClient();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const res = await fetch('/api/backoffice/withdrawals');
      if (!res.ok) throw new Error('Failed to fetch withdrawals');
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

    const channel = supabase
      .channel('withdrawals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => [payload.new as WithdrawalRow, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) =>
              prev.map((item) => (item.id === payload.new.id ? (payload.new as WithdrawalRow) : item))
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

  const columns: Column<WithdrawalRow>[] = [
    { header: 'Request ID', accessorKey: 'id' },
    { header: 'User ID', accessorKey: 'user_id' },
    { header: 'Amount', cell: (row) => `${row.diamond_amount || row.amount || 0} Diamonds` },
    { header: 'Method', cell: (row) => <span className="capitalize">{row.payment_method || row.method || 'Unknown'}</span> },
    { header: 'Date', cell: (row) => new Date(row.created_at || row.date || Date.now()).toLocaleString() },
    { header: 'Status', cell: (row) => <span className="capitalize font-medium">{row.status}</span> },
    { header: 'Actions', cell: () => <span className="text-blue-500 cursor-pointer hover:underline">Review</span> },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Withdrawal Requests" />
      <div className="p-8">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRetry={fetchData}
          emptyState={{
            icon: Banknote,
            title: 'No pending withdrawal requests',
            description: 'All creators are paid up. When a creator requests a payout, it will appear here for your review.',
          }}
        />
      </div>
    </div>
  );
}
