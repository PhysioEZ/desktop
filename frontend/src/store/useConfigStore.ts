import { create } from "zustand";
import { persist } from "zustand/middleware";
import { API_BASE_URL, authFetch } from "../config";

interface PaymentMethod {
  method_code: string;
  method_name: string;
}

interface ConfigStore {
  paymentMethods: PaymentMethod[] | null;
  lastUpdated: number | null;
  isLoading: boolean;
  fetchPaymentMethods: (force?: boolean) => Promise<void>;
  setPaymentMethods: (methods: PaymentMethod[]) => void;
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      paymentMethods: null,
      lastUpdated: null,
      isLoading: false,

      fetchPaymentMethods: async (force = false) => {
        const { paymentMethods, lastUpdated } = get();
        
        // If we have data and it's less than 24 hours old, don't fetch unless forced
        const oneDay = 24 * 60 * 60 * 1000;
        if (!force && paymentMethods && lastUpdated && Date.now() - lastUpdated < oneDay) {
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authFetch(`${API_BASE_URL}/reception/get_payment_methods`);
          const res = await response.json();
          if (res.status === "success") {
            set({ 
              paymentMethods: res.data, 
              lastUpdated: Date.now(),
              isLoading: false 
            });
          }
        } catch (err) {
          console.error("Failed to fetch payment methods:", err);
          set({ isLoading: false });
        }
      },

      setPaymentMethods: (paymentMethods) => 
        set({ paymentMethods, lastUpdated: Date.now() }),
    }),
    {
      name: "config-storage",
    }
  )
);
