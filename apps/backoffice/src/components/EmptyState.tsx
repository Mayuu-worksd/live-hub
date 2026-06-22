import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-white/[0.08] rounded-[16px] bg-[#1A1A1A]/50">
      <div className="h-12 w-12 rounded-full bg-white/[0.05] flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-neutral-400" />
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-neutral-400 max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-[#131313]"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
