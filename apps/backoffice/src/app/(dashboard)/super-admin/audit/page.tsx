'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { History } from 'lucide-react';

interface AuditRow {
  id: string;
  created_at: string;
  admin_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  details: Record<string, any> | null;
}

export default function SuperAdminAudit() {
  const [data, setData] = React.useState<AuditRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | undefined>();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(undefined);
      const res = await fetch('/api/backoffice/audit');
      if (!res.ok) throw new Error('Failed to fetch audit logs');
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

  const columns: Column<AuditRow>[] = [
    { header: 'Timestamp', cell: (row) => new Date(row.created_at).toLocaleString() },
    { header: 'Admin ID', cell: (row) => row.admin_id ?? '—' },
    { header: 'Action', accessorKey: 'action' },
    { header: 'Target Table', cell: (row) => row.target_table ?? '—' },
    { header: 'Target ID', cell: (row) => row.target_id ?? '—' },
    { header: 'Details', cell: (row) => row.details ? JSON.stringify(row.details).slice(0, 60) : '—' },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Audit Logs" />
      <div className="p-8">
        <DataTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          error={error}
          onRetry={fetchData}
          emptyState={{
            icon: History,
            title: 'No audit events recorded',
            description: 'System administrative actions will appear here.',
          }}
        />
      </div>
    </div>
  );
}
