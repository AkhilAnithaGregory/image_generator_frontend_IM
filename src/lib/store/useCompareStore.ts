import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCompareStore = create(
  persist(
    (set) => ({
      compareList: [],

      addToCompare: (img) =>
        set((state) => {
          if (state.compareList.find((i) => i.id === img.id)) {
            return state;
          }

          if (state.compareList.length >= 2) {
            return state;
          }

          return {
            compareList: [...state.compareList, img],
          };
        }),

      removeFromCompare: (id) =>
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