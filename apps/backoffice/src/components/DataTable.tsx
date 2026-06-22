import React from 'react';
import { LucideIcon } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyState: {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  error,
  onRetry,
  emptyState,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-[16px] overflow-hidden">
        <table className="min-w-full divide-y divide-white/[0.06]">
          <thead className="bg-[#1A1A1A]">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#1A1A1A] divide-y divide-white/[0.06]">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                {columns.map((_, j) => (
                  <td key={j} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-white/[0.05] rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1A1A1A] border border-destructive/50 rounded-[16px] p-6 text-center">
        <p className="text-destructive mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-white/[0.05] text-white rounded-md hover:bg-white/[0.1] transition-colors text-sm font-medium"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState {...emptyState} />;
  }

  return (
    <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-[16px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/[0.06]">
          <thead className="bg-[#1A1A1A]">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-3 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[#1A1A1A] divide-y divide-white/[0.06]">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-white/[0.03] transition-colors">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                    {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey]) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
