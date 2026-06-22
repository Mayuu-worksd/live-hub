import { create } from 'zustand';
import type { User, Profile, UserRole } from '@/types/user';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  role: 'viewer',
  isLoading: true,
  setUser: (user) => set({ user, role: user?.role ?? 'viewer' }),
  setProfile: (profile) => set({ profile }),
  clearUser: () => set({ user: null, profile: null, role: 'viewer' }),
  setLoading: (isLoading) => set({ isLoading }),
}));
