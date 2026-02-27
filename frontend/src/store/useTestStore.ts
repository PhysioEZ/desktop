import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_BASE_URL, authFetch } from "../config";

interface TestRecord {
  uid: string;
  patient_name: string;
  test_name: string;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  test_status: string;
  test_uid: string;
}

interface TestStore {
  tests: TestRecord[];
  isLoading: boolean;
  pagination: {
    page: number;
    limit: number;
    total_records: number;
    total_pages: number;
  };
  stats: {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    total_revenue: number;
    total_paid: number;
    total_due: number;
  };
  lastFetched: number | null;
  setTests: (tests: TestRecord[]) => void;
  setLastFetched: (time: number) => void;
  fetchTests: (branchId: number, page?: number, limit?: number, forceRefresh?: boolean) => Promise<void>;
  clearStore: () => void;
}

export const useTestStore = create<TestStore>()(
  persist(
    (set, get) => ({
      tests: [],
      isLoading: false,
      pagination: {
        page: 1,
        limit: 15,
        total_records: 0,
        total_pages: 1,
      },
      stats: {
        total: 0,
        completed: 0,
        pending: 0,
        cancelled: 0,
        total_revenue: 0,
        total_paid: 0,
        total_due: 0,
      },
      lastFetched: null,
      setTests: (tests) => set({ tests }),
      setLastFetched: (time) => set({ lastFetched: time }),
      fetchTests: async (branchId: number, pageNum = 1, limitNum = 15, forceRefresh = false) => {
        const { tests, lastFetched } = get();
        
        // Use cache if not forced and we have data fetched recently
        if (!forceRefresh && tests.length > 0 && lastFetched) {
           return;
        }

        if (pageNum === 1) {
          set({ isLoading: true });
        }
        
        try {
          const bodyData = {
            action: "fetch",
            page: pageNum,
            limit: limitNum,
            search: "",
            branch_id: branchId
          };

          const params = new URLSearchParams();
          params.append("action", "fetch");

          const response = await authFetch(
            `${API_BASE_URL}/reception/tests?${params.toString()}`,
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                ...(forceRefresh && { "X-Refresh": "true" })
              },
              body: JSON.stringify(bodyData),
            }
          );
          const res = await response.json();
          if (res.success) {
            set((state) => {
              const newData = pageNum === 1 ? res.data : [...state.tests, ...res.data];
              const newStats = pageNum === 1 ? {
                total: res.stats?.total || 0,
                completed: res.stats?.completed || 0,
                pending: res.stats?.pending || 0,
                cancelled: res.stats?.cancelled || 0,
                total_revenue: res.data.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0),
                total_paid: res.data.reduce((acc: number, curr: any) => acc + (Number(curr.paid_amount) || 0), 0),
                total_due: res.data.reduce((acc: number, curr: any) => acc + (Number(curr.due_amount) || 0), 0),
              } : state.stats;

              return {
                tests: newData,
                stats: newStats,
                pagination: {
                  page: pageNum,
                  limit: limitNum,
                  total_records: res.stats?.total || 0,
                  total_pages: Math.ceil((res.stats?.total || 0) / limitNum),
                },
                lastFetched: Date.now(),
                isLoading: false,
              };
            });
          } else {
             set({ isLoading: false });
          }
        } catch (error) {
          console.error("Fetch Tests Error:", error);
          set({ isLoading: false });
        }
      },
      clearStore: () => set({
        tests: [],
        isLoading: false,
        pagination: { page: 1, limit: 15, total_records: 0, total_pages: 1 },
        stats: { total: 0, completed: 0, pending: 0, cancelled: 0, total_revenue: 0, total_paid: 0, total_due: 0 },
        lastFetched: null,
      }),
    }),
    {
      name: "test-cache",
    }
  )
);
