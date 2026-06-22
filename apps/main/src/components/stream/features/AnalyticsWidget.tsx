'use client';

import { Users, TrendingUp, Gem, UserPlus, BarChart3 } from 'lucide-react';
import { useStreamStore } from '@/stores/useStreamStore';

interface AnalyticsWidgetProps {
  streamId: string;
}

export default function AnalyticsWidget({ streamId }: AnalyticsWidgetProps) {
  const { viewerCount } = useStreamStore();

  const stats = [
    { label: 'Viewers', value: viewerCount, icon: Users, color: 'text-violet-400' },
    { label: 'Peak Viewers', value: Math.max(viewerCount, 120), icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'New Followers', value: '+24', icon: UserPlus, color: 'text-fuchsia-400' },
    { label: 'Diamonds', value: '1.2k', icon: Gem, color: 'text-amber-400' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-zinc-200 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-400" /> Broadcast Stats
        </h3>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
        </div>
      </div>
      
      {/* Sleek Integrated Grid */}
      <div className="grid grid-cols-2 gap-px bg-white/[0.08] border border-white/[0.08] rounded-xl overflow-hidden bg-zinc-900/50">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label}
              className="bg-[#09090b]/60 backdrop-blur-md p-3.5 flex flex-col gap-1.5 hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 ${stat.color} opacity-80`} />
                <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider">{stat.label}</span>
              </div>
              <span className="text-white text-lg font-bold font-mono tracking-tight pl-0.5">{stat.value}</span>
            </div>
          );
        })}
      </div>

      {/* Daily Gift Goal Progress Panel */}
      <div className="bg-[#09090b]/40 border border-white/[0.08] rounded-xl p-4 flex flex-col gap-2.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-300">Daily Gift Goal</span>
            <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold">45%</span>
          </div>
          <span className="text-xs font-bold text-white font-mono">540 <span className="text-zinc-500 font-medium">/ 1,200</span></span>
        </div>
        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/[0.04] p-0.5">
          <div 
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-1 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.3)] transition-all duration-500" 
            style={{ width: '45%' }}
          ></div>
        </div>
      </div>
    </div>
  );
}
