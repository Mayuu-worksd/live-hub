'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { DollarSign } from 'lucide-react';

interface CommissionRow {
  id: string;
  date: string;
  amount: string;
  status: string;
}

export default function AgencyFinancials() {
  const [data, setData] = React.useState<CommissionRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const res = await fetch('/api/backoffice/agency/financials');
      if (!res.ok) throw new Error('Failed to fetch financials');
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

  const columns: Column<CommissionRow>[] = [
    { header: 'Date', accessorKey: 'date' },
    { header: 'Amount', accessorKey: 'amount' },
    { header: 'Status', accessorKey: 'status' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header 
        title="Financials & Commission" 
        actions={
          <button className="px-4 py-2 border border-neutral-700 bg-neutral-900 text-white rounded-md text-sm font-medium hover:bg-neutral-800 transition-colors">
            Export CSV
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
            icon: DollarSign,
            title: 'No commission data available',
            description: 'Earnings will appear here once your creators start generating revenue.',
          }}
        />
      </div>
    </div>
  );
}
