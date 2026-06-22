'use client';

import React from 'react';
import { Header } from '@/components/Header';
import { DataTable, Column } from '@/components/DataTable';
import { History } from 'lucide-react';

interface AuditRow {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
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
    { header: 'Timestamp', accessorKey: 'timestamp' },
    { header: 'Actor', accessorKey: 'actor' },
    { header: 'Action Type', accessorKey: 'action' },
    { header: 'Target', accessorKey: 'target' },
    { header: 'IP Address', accessorKey: 'ip' },
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
