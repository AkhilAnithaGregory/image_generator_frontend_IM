import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useImageStore = create(
  persist(
    (set, get) => ({
      images: [],
      nodes: [],
      edges: [],

      selectedNodeId: null,

      // ❌ remove this eventually (derived from images)
      lastGeneratedImage: null,

      addImage: (image) =>
        set((state) => ({
          images: [...state.images, image],
          lastGeneratedImage: image, // keep in sync
        })),

      setGraph: (nodes, edges) =>
        set(() => ({
          nodes,
          edges,
        })),

      setSelectedNodeId: (id) =>
        set(() => ({
          selectedNodeId: id,
        })),

      setLastGeneratedImage: (img) =>
        set(() => ({
          lastGeneratedImage: img,
        })),

      // ✅ FIXED revert logic
      revertCurrentImage: (currentImg) =>
        set((state) => {
          if (!currentImg) return state;

          const index = state.images.findIndex(
            (img) => img.id === currentImg.id
          );

          if (index === -1) return state;

          // remove current image and everything after it (true rollback behavior)
          const newImages = state.images.slice(0, index);

          const newLast = newImages.length
            ? newImages[newImages.length - 1]
            : null;

          return {
            images: newImages,
            lastGeneratedImage: newLast,
          };
        }),

      reset: () =>
        set({
          images: [],
          nodes: [],
          edges: [],
          selectedNodeId: null,
          lastGeneratedImage: null,
        }),
    }),
    {
      name: "image-storage",

      partialize: (state) => ({
        images: state.images,
        selectedNodeId: state.selectedNodeId,
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);