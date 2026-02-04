import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DashboardStore {
  data: any | null;
  formOptions: any | null;
  lastSync: string | null;
  pendingApprovals: any[] | null;
  timeSlots: { date: string; slots: any[] } | null;
  notifications: any[] | null;
  unreadCount: number;
  insights: any[] | null;
  profileData: any | null;
  setData: (data: any) => void;
  setFormOptions: (options: any) => void;
  setPendingApprovals: (approvals: any[]) => void;
  setTimeSlots: (date: string, slots: any[]) => void;
  setNotifications: (notifications: any[]) => void;
  setUnreadCount: (count: number) => void;
  setInsights: (insights: any[]) => void;
  setProfileData: (profile: any) => void;
  setLastSync: (time: string) => void;
  clearStore: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      data: null,
      formOptions: null,
      lastSync: null,
      pendingApprovals: null,
      timeSlots: null,
      notifications: null,
      unreadCount: 0,
      insights: null,
      profileData: null,
      setData: (data) => set({ data }),
      setFormOptions: (options) => set({ formOptions: options }),
      setPendingApprovals: (approvals) => set({ pendingApprovals: approvals }),
      setTimeSlots: (date, slots) => set({ timeSlots: { date, slots } }),
      setNotifications: (notifications) => set({ notifications }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      setInsights: (insights) => set({ insights }),
      setProfileData: (profileData) => set({ profileData }),
      setLastSync: (time) => set({ lastSync: time }),
      clearStore: () =>
        set({
          data: null,
          formOptions: null,
          lastSync: null,
          pendingApprovals: null,
          timeSlots: null,
          notifications: null,
          unreadCount: 0,
          insights: null,
          profileData: null,
        }),
    }),
    {
      name: "dashboard-cache",
    }
  )
);
