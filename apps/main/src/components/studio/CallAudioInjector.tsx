'use client';

import { useEffect, useState } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';
import VoiceSettingsModal from './VoiceSettingsModal';
import { Settings2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function CallAudioInjector({ roomName }: { roomName: string }) {
  const { localParticipant } = useLocalParticipant();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showVoiceStudio, setShowVoiceStudio] = useState(false);
  
  const { settings, updateSettings, processedTrack, isProcessing } = useVoiceEngine(roomName, isAudioEnabled);

  useEffect(() => {
    if (processedTrack && localParticipant) {
      localParticipant.publishTrack(processedTrack);
      return () => {
        localParticipant.unpublishTrack(processedTrack);
      };
    }
  }, [processedTrack, localParticipant]);

  return (
    <>
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <button
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className={cn(
            'p-3 rounded-full flex items-center justify-center transition-all border border-white/10 shadow-xl backdrop-blur-md',
            isAudioEnabled ? 'bg-black/60 hover:bg-black/80 text-white' : 'bg-rose text-white'
          )}
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        <button
          onClick={() => setShowVoiceStudio(true)}
          className="p-3 rounded-full bg-violet/80 hover:bg-violet flex items-center justify-center text-white transition-all shadow-xl backdrop-blur-md shadow-violet/20"
        >
          <Settings2 className="h-5 w-5" />
        </button>
      </div>

      <VoiceSettingsModal 
        isOpen={showVoiceStudio} 
        onClose={() => setShowVoiceStudio(false)} 
        settings={settings} 
        onUpdate={updateSettings} 
        isProcessing={isProcessing} 
      />
    </>
  );
}
