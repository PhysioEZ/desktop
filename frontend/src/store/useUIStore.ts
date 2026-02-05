import { create } from "zustand";

interface UIStore {
  hasDashboardAnimated: boolean;
  setHasDashboardAnimated: (val: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  hasDashboardAnimated: false,
  setHasDashboardAnimated: (val) => set({ hasDashboardAnimated: val }),
}));
