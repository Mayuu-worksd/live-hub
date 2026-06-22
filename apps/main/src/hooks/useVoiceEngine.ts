import { useEffect, useState, useRef, useCallback } from 'react';
import { createLocalAudioTrack, LocalAudioTrack } from 'livekit-client';
import type { VoiceSettings } from '@/types/voice';
import toast from 'react-hot-toast';

export function useVoiceEngine(roomName: string, isAudioEnabled: boolean) {
  const [settings, setSettings] = useState<VoiceSettings | null>(null);
  const [processedTrack, setProcessedTrack] = useState<LocalAudioTrack | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial settings
  useEffect(() => {
    fetch('/api/voice/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) setSettings(data.settings);
      })
      .catch(console.error);
  }, []);

  const startEngine = useCallback(async () => {
    if (!settings || !settings.is_enabled) return;
    
    try {
      setIsProcessing(true);

      // Start Session Analytics
      const res = await fetch('/api/voice/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ livekit_room_name: roomName })
      });
      const data = await res.json();
      if (data.session) setSessionId(data.session.id);

      // Setup Web Audio API Intercept
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      destinationNodeRef.current = audioContextRef.current.createMediaStreamDestination();

      if (settings.accent === 'original' && settings.noise_reduction === 'off') {
        // Pass-through: No AI modification
        sourceNodeRef.current.connect(destinationNodeRef.current);
      } else {
        // AI Processing Mode (Seed-VC Backend)
        // NOTE: GPU Backend (Seed-VC) is pending deployment.
        // Operating in 0ms pass-through mode until NEXT_PUBLIC_VOICE_ENGINE_WS_URL and Python GPU service are available.
        // Future engineers: Implement an AudioWorkletProcessor here to chunk Float32 arrays for the WebSocket.
        sourceNodeRef.current.connect(destinationNodeRef.current);
      }

      // Generate LiveKit compatible LocalAudioTrack from our processed destination
      const processedMediaStreamTrack = destinationNodeRef.current.stream.getAudioTracks()[0];
      const newTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
      });
      // Override the underlying media stream track with our processed one
      (newTrack as any).mediaStreamTrack = processedMediaStreamTrack;
      setProcessedTrack(newTrack);

    } catch (err) {
      console.error('[Voice Engine] Error starting:', err);
      toast.error('Failed to start AI Voice Engine');
      setIsProcessing(false);
    }
  }, [settings, roomName]);

  const stopEngine = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
    if (destinationNodeRef.current) destinationNodeRef.current.disconnect();
    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }

    if (processedTrack) {
      processedTrack.stop();
      setProcessedTrack(null);
    }

    setIsProcessing(false);

    if (sessionId) {
      fetch('/api/voice/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, action: 'end' }),
        keepalive: true
      });
      setSessionId(null);
    }
  }, [processedTrack, sessionId]);

  // Handle Mute/Unmute locally
  useEffect(() => {
    if (processedTrack) {
      if (isAudioEnabled) {
        processedTrack.unmute();
      } else {
        processedTrack.mute();
      }
    }
  }, [isAudioEnabled, processedTrack]);

  // Restart engine if settings change significantly (e.g. enabled/disabled)
  useEffect(() => {
    if (!settings) return;
    if (settings.is_enabled && !isProcessing) {
      startEngine();
    } else if (!settings.is_enabled && isProcessing) {
      stopEngine();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.is_enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopEngine();
    };
  }, [stopEngine]);

  const updateSettings = async (updates: Partial<VoiceSettings>) => {
    try {
      const res = await fetch('/api/voice/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update voice settings');
    }
  };

  return {
    settings,
    updateSettings,
    processedTrack,
    isProcessing
  };
}
