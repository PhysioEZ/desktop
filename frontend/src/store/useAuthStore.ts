import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useDashboardStore } from './useDashboardStore';
import { useRegistrationStore } from './useRegistrationStore';
import { usePatientStore } from './usePatientStore';
import { useTestStore } from './useTestStore';
import { useInquiryStore } from './useInquiryStore';
import { useConfigStore } from './useConfigStore';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  token: string;
  branch_id: number;
  photo?: string;
  employee_id: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => {
        // Clear ALL data caches before setting new user
        // This forces fresh data fetches on the Welcome screen
        useDashboardStore.getState().clearStore();
        useRegistrationStore.getState().clearCache();
        usePatientStore.getState().clearStore();
        useTestStore.getState().clearStore();
        useInquiryStore.getState().clearCache();
        useConfigStore.getState().clearStore();
        
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        // Also clear caches on logout for clean slate
        useDashboardStore.getState().clearStore();
        useRegistrationStore.getState().clearCache();
        usePatientStore.getState().clearStore();
        useTestStore.getState().clearStore();
        useInquiryStore.getState().clearCache();
        useConfigStore.getState().clearStore();
        
        set({ user: null, isAuthenticated: false });
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
