import React from 'react';
import { LucideIcon } from 'lucide-react';

interface WidgetProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
}

export function Widget({ title, value, icon: Icon, trend }: WidgetProps) {
  return (
    <div className="bg-[#1A1A1A] border border-white/[0.06] rounded-[16px] p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-neutral-400">{title}</h3>
        {Icon && <Icon className="h-5 w-5 text-primary" />}
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-semibold text-white">{value}</span>
        {trend && (
          <span
            className={`text-sm font-medium ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}
