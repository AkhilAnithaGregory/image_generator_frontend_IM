import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ImageItem } from "./useProjectStore";

interface CompareStoreState {
  compareList: ImageItem[];
  addToCompare: (img: ImageItem) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
}

export const useCompareStore = create<CompareStoreState>()(
  persist(
    (set) => ({
      compareList: [],

      addToCompare: (img: ImageItem) =>
        set((state) => {
          if (state.compareList.find((i) => i.id === img.id)) {
            return state;
          }

          if (state.compareList.length >= 2) {
            return state;
          }

          return {
            compareList: [...state.compareList, img],
          } as Partial<CompareStoreState> as CompareStoreState;
        }),

      removeFromCompare: (id: string) =>
        set((state) => ({
          compareList: state.compareList.filter((i) => i.id !== id),
        })),

      clearCompare: () => set({ compareList: [] }),
    }),
    {
      name: "compare-storage",
    }
  )
);