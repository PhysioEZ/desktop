import { create } from "zustand";
import { persist } from "zustand/middleware";

interface InquiryStore {
  consultations: any[] | null;
  diagnostics: any[] | null;
  followUpLogs: Record<number, any[]>;
  setConsultations: (data: any[]) => void;
  setDiagnostics: (data: any[]) => void;
  setFollowUpLogs: (inquiryId: number, logs: any[]) => void;
  clearCache: () => void;
}

export const useInquiryStore = create<InquiryStore>()(
  persist(
    (set) => ({
      consultations: null,
      diagnostics: null,
      followUpLogs: {},
      setConsultations: (consultations) => set({ consultations }),
      setDiagnostics: (diagnostics) => set({ diagnostics }),
      setFollowUpLogs: (inquiryId, logs) =>
        set((state) => ({
          followUpLogs: { ...state.followUpLogs, [inquiryId]: logs },
        })),
      clearCache: () => set({ consultations: null, diagnostics: null, followUpLogs: {} }),
    }),
    {
      name: "inquiry-cache",
    }
  )
);
