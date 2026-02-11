import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RegistrationStore {
  registrations: any[] | null;
  options: any | null;
  serviceTracks: any[] | null;
  pagination: any | null;
  lastFetched: number | null;
  lastParams: any | null;
  detailsCache: Record<number, any>;
  dynamicModalOptions: { branchId?: string | number; employees: any[]; paymentMethods: any[] } | null;
  serviceSlotsCache: Record<string, any[]>;
  registrationsCache: Record<string, { data: any[]; pagination: any }>;
  cancelledRegistrationsCache: any[] | null;
  setRegistrations: (data: any[]) => void;
  setOptions: (options: any) => void;
  setServiceTracks: (tracks: any[]) => void;
  setPagination: (pagination: any) => void;
  setLastFetched: (time: number) => void;
  setLastParams: (params: any) => void;
  setDetailsCache: (id: number, data: any) => void;
  setDynamicModalOptions: (options: { branchId?: string | number; employees: any[]; paymentMethods: any[] }) => void;
  setServiceSlotsCache: (key: string, data: any[]) => void;
  setRegistrationsCache: (key: string, data: any[], pagination: any) => void;
  setCancelledRegistrationsCache: (data: any[]) => void;
  clearCache: () => void;
}

export const useRegistrationStore = create<RegistrationStore>()(
  persist(
    (set) => ({
      registrations: null,
      options: null,
      serviceTracks: null,
      pagination: null,
      lastFetched: null,
      lastParams: null,
      detailsCache: {},
      dynamicModalOptions: null,
      serviceSlotsCache: {},
      registrationsCache: {},
      cancelledRegistrationsCache: null,
      setRegistrations: (registrations) => set({ registrations }),
      setOptions: (options) => set({ options }),
      setServiceTracks: (serviceTracks) => set({ serviceTracks }),
      setPagination: (pagination) => set({ pagination }),
      setLastFetched: (lastFetched) => set({ lastFetched }),
      setLastParams: (lastParams) => set({ lastParams }),
      setDetailsCache: (id, data) =>
        set((state) => ({
          detailsCache: { ...state.detailsCache, [id]: data },
        })),
      setDynamicModalOptions: (dynamicModalOptions) => set({ dynamicModalOptions }),
      setServiceSlotsCache: (key, data) =>
        set((state) => ({
          serviceSlotsCache: { ...state.serviceSlotsCache, [key]: data },
        })),
      setRegistrationsCache: (key, data, pagination) =>
        set((state) => ({
          registrationsCache: {
            ...state.registrationsCache,
            [key]: { data, pagination },
          },
        })),
      setCancelledRegistrationsCache: (cancelledRegistrationsCache) => set({ cancelledRegistrationsCache }),
      clearCache: () =>
        set({
          registrations: null,
          options: null,
          serviceTracks: null,
          pagination: null,
          lastFetched: null,
          lastParams: null,
          detailsCache: {},
          dynamicModalOptions: null,
          serviceSlotsCache: {},
          registrationsCache: {},
          cancelledRegistrationsCache: null,
        }),
    }),
    {
      name: "registration-cache",
    }
  )
);
