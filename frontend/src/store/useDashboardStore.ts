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
  publicNotes: any[] | null;
  privateNotes: any[] | null;
  branchUsers: any[] | null;
  scheduleAppointments: any[] | null;
  scheduleWeekStart: string | null;
  searchCache: Record<string, any[]>;
  notesPagination: {
    public: { hasMore: boolean; offset: number };
    private: { hasMore: boolean; offset: number };
  };
  globalSearchQuery: string;
  globalSearchResults: any[];
  showGlobalSearch: boolean;
  isGlobalSearchLoading: boolean;
  setData: (data: any) => void;
  setFormOptions: (options: any) => void;
  setPendingApprovals: (approvals: any[]) => void;
  setTimeSlots: (date: string, slots: any[]) => void;
  setNotifications: (notifications: any[]) => void;
  setUnreadCount: (count: number) => void;
  setInsights: (insights: any[]) => void;
  setProfileData: (profile: any) => void;
  setPublicNotes: (notes: any[]) => void;
  setPrivateNotes: (notes: any[]) => void;
  setBranchUsers: (users: any[]) => void;
  setScheduleAppointments: (appointments: any[]) => void;
  setScheduleWeekStart: (weekStart: string | null) => void;
  setSearchCache: (query: string, results: any[]) => void;
  setNotesPagination: (type: "public" | "private", pagination: { hasMore: boolean; offset: number }) => void;
  setGlobalSearchQuery: (query: string) => void;
  setGlobalSearchResults: (results: any[]) => void;
  setShowGlobalSearch: (show: boolean) => void;
  setIsGlobalSearchLoading: (loading: boolean) => void;
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
      publicNotes: null,
      privateNotes: null,
      branchUsers: null,
      scheduleAppointments: null,
      scheduleWeekStart: null,
      searchCache: {},
      notesPagination: {
        public: { hasMore: true, offset: 0 },
        private: { hasMore: true, offset: 0 },
      },
      globalSearchQuery: "",
      globalSearchResults: [],
      showGlobalSearch: false,
      isGlobalSearchLoading: false,
      setData: (data) => set({ data }),
      setFormOptions: (options) => set({ formOptions: options }),
      setPendingApprovals: (approvals) => set({ pendingApprovals: approvals }),
      setTimeSlots: (date, slots) => set({ timeSlots: { date, slots } }),
      setNotifications: (notifications) => set({ notifications }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      setInsights: (insights) => set({ insights }),
      setProfileData: (profileData) => set({ profileData }),
      setPublicNotes: (publicNotes) => set({ publicNotes }),
      setPrivateNotes: (privateNotes) => set({ privateNotes }),
      setBranchUsers: (branchUsers) => set({ branchUsers }),
      setScheduleAppointments: (scheduleAppointments) => set({ scheduleAppointments }),
      setScheduleWeekStart: (scheduleWeekStart) => set({ scheduleWeekStart }),
      setSearchCache: (query, results) => 
        set((state) => ({ 
          searchCache: { ...state.searchCache, [query]: results } 
        })),
      setNotesPagination: (type, pagination) =>
        set((state) => ({
          notesPagination: {
            ...state.notesPagination,
            [type]: pagination,
          },
        })),
      setGlobalSearchQuery: (globalSearchQuery) => set({ globalSearchQuery }),
      setGlobalSearchResults: (globalSearchResults) => set({ globalSearchResults }),
      setShowGlobalSearch: (showGlobalSearch) => set({ showGlobalSearch }),
      setIsGlobalSearchLoading: (isGlobalSearchLoading) => set({ isGlobalSearchLoading }),
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
          publicNotes: null,
          privateNotes: null,
          branchUsers: null,
          scheduleAppointments: null,
          scheduleWeekStart: null,
          searchCache: {},
          notesPagination: {
            public: { hasMore: true, offset: 0 },
            private: { hasMore: true, offset: 0 },
          },
          globalSearchQuery: "",
          globalSearchResults: [],
          showGlobalSearch: false,
          isGlobalSearchLoading: false,
        }),
    }),
    {
      name: "dashboard-cache",
    }
  )
);
