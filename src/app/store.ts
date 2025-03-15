import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  username?: string;
  profilePicture?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  setAuth: (isAuthenticated: boolean, user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setAuth: (isAuthenticated: boolean, user: User | null) => 
    set({ isAuthenticated, user }),
}));
