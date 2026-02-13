import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    login: (user: User, accessToken: string, refreshToken: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: !!localStorage.getItem('accessToken'),

    login: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, isAuthenticated: true });
    },

    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
    },

    setUser: (user) => set({ user }),
}));

// UI Store for sidebar, dark mode, etc.
interface UIState {
    sidebarOpen: boolean;
    darkMode: boolean;
    toggleSidebar: () => void;
    toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
    sidebarOpen: true,
    darkMode: localStorage.getItem('darkMode') === 'true',

    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

    toggleDarkMode: () =>
        set((s) => {
            const newMode = !s.darkMode;
            localStorage.setItem('darkMode', String(newMode));
            if (newMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
            return { darkMode: newMode };
        }),
}));
