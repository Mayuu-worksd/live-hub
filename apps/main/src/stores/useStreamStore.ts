import { create } from 'zustand';
import type { Stream } from '@/types/stream';

interface StreamState {
  activeStream: Stream | null;
  isLive: boolean;
  viewerCount: number;
  livekitToken: string | null;
  setStream: (stream: Stream | null) => void;
  setViewerCount: (count: number) => void;
  setToken: (token: string | null) => void;
  endStream: () => void;
}

export const useStreamStore = create<StreamState>((set) => ({
  activeStream: null,
  isLive: false,
  viewerCount: 0,
  livekitToken: null,
  setStream: (stream) => set({ activeStream: stream, isLive: stream?.status === 'live' }),
  setViewerCount: (viewerCount) => set({ viewerCount }),
  setToken: (token) => set({ livekitToken: token }),
  endStream: () => set({ activeStream: null, isLive: false, viewerCount: 0, livekitToken: null }),
}));
