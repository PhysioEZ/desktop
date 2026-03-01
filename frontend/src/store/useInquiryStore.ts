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

// Helper to deduplicate inquiries by inquiry_id
const deduplicateData = (data: any[]): any[] => {
  if (!data || !Array.isArray(data)) return data;
  const seen = new Set<number>();
  return data.filter((item) => {
    if (seen.has(item.inquiry_id)) {
      return false;
    }
    seen.add(item.inquiry_id);
    return true;
  });
};

export const useInquiryStore = create<InquiryStore>()(
  persist(
    (set) => ({
      consultations: null,
      diagnostics: null,
      followUpLogs: {},
      setConsultations: (consultations) => set({ consultations: deduplicateData(consultations) }),
      setDiagnostics: (diagnostics) => set({ diagnostics: deduplicateData(diagnostics) }),
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
