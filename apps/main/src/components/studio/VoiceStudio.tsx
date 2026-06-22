'use client';

import { useState } from 'react';
import type { VoiceSettings, AccentType, NoiseReductionLevel, QualityType } from '@/types/voice';
import { Mic, Globe, Waves, Sparkles, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface VoiceStudioProps {
  settings: VoiceSettings | null;
  onUpdate: (updates: Partial<VoiceSettings>) => Promise<void>;
  isProcessing?: boolean;
}

export default function VoiceStudio({ settings, onUpdate, isProcessing }: VoiceStudioProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (key: keyof VoiceSettings, value: any) => {
    setIsUpdating(true);
    await onUpdate({ [key]: value });
    setIsUpdating(false);
  };

  if (!settings) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-violet" /></div>;

  return (
    <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 space-y-8 w-full max-w-md shadow-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl transition-colors", settings.is_enabled ? "bg-violet/20 text-violet" : "bg-white/5 text-zinc-500")}>
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">AI Voice Engine</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">Coming Soon</span>
            </div>
            <p className="text-sm text-zinc-400">Powered by Seed-VC</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" className="sr-only peer" checked={settings.is_enabled} onChange={(e) => handleUpdate('is_enabled', e.target.checked)} disabled={isUpdating} />
          <div className="w-14 h-7 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-violet"></div>
        </label>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-200/80">
        GPU deployment is pending. Adjusting settings below will save your AI preferences to your profile, but voice conversion is temporarily in pass-through mode.
      </div>

      <div className={cn("space-y-6 transition-opacity", !settings.is_enabled && "opacity-50 pointer-events-none")}>
        {/* Accent Selection */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Globe className="h-4 w-4" /> Target Accent
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['original', 'american', 'british', 'australian'] as AccentType[]).map((accent) => (
              <button
                key={accent}
                onClick={() => handleUpdate('accent', accent)}
                className={cn(
                  "px-4 py-3 rounded-xl border text-sm font-medium capitalize transition-all",
                  settings.accent === accent 
                    ? "bg-violet/10 border-violet text-violet" 
                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                )}
              >
                {accent}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Quality */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Sparkles className="h-4 w-4" /> Enhancement Level
          </label>
          <div className="flex gap-2">
            {(['standard', 'enhanced'] as QualityType[]).map((quality) => (
              <button
                key={quality}
                onClick={() => handleUpdate('quality', quality)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-all",
                  settings.quality === quality 
                    ? "bg-fuchsia-500/10 border-fuchsia-500 text-fuchsia-400" 
                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                )}
              >
                {quality}
              </button>
            ))}
          </div>
        </div>

        {/* Noise Reduction */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
            <Waves className="h-4 w-4" /> Noise Reduction
          </label>
          <div className="flex gap-2">
            {(['off', 'medium', 'high'] as NoiseReductionLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => handleUpdate('noise_reduction', level)}
                className={cn(
                  "flex-1 py-2 rounded-lg border text-sm font-medium capitalize transition-all",
                  settings.noise_reduction === level 
                    ? "bg-cyan-500/10 border-cyan-500 text-cyan-400" 
                    : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
                )}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center justify-center gap-2 text-xs text-violet font-semibold animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          Seed-VC Engine Active
        </div>
      )}
    </div>
  );
}
