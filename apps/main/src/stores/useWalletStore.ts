import { create } from 'zustand';

interface WalletState {
  coinBalance: number;
  diamondBalance: number;
  isLoading: boolean;
  setBalance: (coins: number, diamonds: number) => void;
  setLoading: (loading: boolean) => void;
  refresh: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  coinBalance: 0,
  diamondBalance: 0,
  isLoading: false,
  setBalance: (coinBalance, diamondBalance) => set({ coinBalance, diamondBalance }),
  setLoading: (isLoading) => set({ isLoading }),
  refresh: () => set({ isLoading: true }),
}));
