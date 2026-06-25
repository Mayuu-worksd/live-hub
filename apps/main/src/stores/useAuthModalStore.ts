import { create } from 'zustand';

interface AuthModalState {
  isOpen: boolean;
  actionMessage: string | null;
  openModal: (message?: string) => void;
  closeModal: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  actionMessage: null,
  openModal: (message?: string) => set({ isOpen: true, actionMessage: message || null }),
  closeModal: () => set({ isOpen: false, actionMessage: null }),
}));
