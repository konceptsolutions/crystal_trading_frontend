import { create } from 'zustand';
import { User, authService } from './auth';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  login: async (email, password) => {
    const response = await authService.login(email, password);
    set({ user: response.user, isAuthenticated: true });
  },
  register: async (email, password, name) => {
    const response = await authService.register(email, password, name);
    set({ user: response.user, isAuthenticated: true });
  },
  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },
  init: () => {
    // Only initialize from localStorage on client side
    if (typeof window !== 'undefined') {
      const user = authService.getUser();
      set({ user, isAuthenticated: !!user });
    }
  },
}));

