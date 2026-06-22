import { create } from 'zustand';
import type { StreamMessage } from '@/types/stream';

interface ChatState {
  messages: StreamMessage[];
  addMessage: (message: StreamMessage) => void;
  clearMessages: () => void;
  setMessages: (messages: StreamMessage[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  setMessages: (messages) => set({ messages }),
}));
