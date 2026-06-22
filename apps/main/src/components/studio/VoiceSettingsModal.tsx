'use client';

import { X } from 'lucide-react';
import VoiceStudio from './VoiceStudio';
import type { VoiceSettings } from '@/types/voice';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VoiceSettings | null;
  onUpdate: (updates: Partial<VoiceSettings>) => Promise<void>;
  isProcessing?: boolean;
}

export default function VoiceSettingsModal({ isOpen, onClose, settings, onUpdate, isProcessing }: VoiceSettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 text-zinc-400 hover:text-white transition-colors bg-black/40 rounded-full backdrop-blur-md border border-white/10"
        >
          <X className="h-5 w-5" />
        </button>
        <VoiceStudio settings={settings} onUpdate={onUpdate} isProcessing={isProcessing} />
      </div>
    </div>
  );
}
