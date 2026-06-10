import { create } from "zustand";
import { persist } from "zustand/middleware";

type ImageItem = {
  id: string;
  src: string | null;
  [key: string]: any;
};

type NodeItem = {
  id: string;
  data?: any;
  position?: { x: number; y: number };
  [key: string]: any;
};

type EdgeItem = {
  id: string;
  source: string;
  target: string;
  [key: string]: any;
};

interface ImageStoreState {
  images: ImageItem[];
  nodes: NodeItem[];
  edges: EdgeItem[];
  selectedNodeId: string | null;
  lastGeneratedImage: string | null;
  modelName: string | null;
  aspectRatio: number | null;
  previousImage: string | null;
  uploadedImages: ImageItem[];
  drawingImage: string | null;

  setGraph: (nodes: NodeItem[], edges: EdgeItem[]) => void;
  addImage: (image: ImageItem) => void;
  setSelectedNodeId: (id: string | null) => void;
  setLastGeneratedImage: (img: string | null) => void;
  revertCurrentImage: (currentImg: ImageItem | null) => void;
  reset: () => void;
}

export const useImageStore = create<ImageStoreState>()(
  persist(
    (set, get) => ({
      images: [],
      nodes: [],
      edges: [],
      selectedNodeId: null,
      lastGeneratedImage: null,
      modelName: null,
      aspectRatio: null,
      previousImage: null,
      uploadedImages: [],
      drawingImage: null,

      setGraph: (nodes: NodeItem[], edges: EdgeItem[]) =>
        set(() => ({
          nodes,
          edges,
        })),

      addImage: (image: ImageItem) =>
        set((state) => ({
          images: [...state.images, image],
          lastGeneratedImage: image.src,
        })),

      setSelectedNodeId: (id: string | null) =>
        set(() => ({
          selectedNodeId: id,
        })),

      setLastGeneratedImage: (img: string | null) =>
        set(() => ({
          lastGeneratedImage: img,
        })),

      revertCurrentImage: (currentImg: ImageItem | null) =>
        set((state) => {
          if (!currentImg) return state;

          const index = state.images.findIndex((img) => img.id === currentImg.id);
          if (index === -1) return state;

          const newImages = state.images.slice(0, index);
          const newLast = newImages.length ? newImages[newImages.length - 1] : null;

          return {
            images: newImages,
            lastGeneratedImage: newLast?.src ?? null,
          } as Partial<ImageStoreState> as ImageStoreState;
        }),

      reset: () =>
        set({
          images: [],
          nodes: [], // reset them too
          edges: [],
          selectedNodeId: null,
          lastGeneratedImage: null,
        }),
    }),
    {
      name: "image-storage",
      partialize: (state) => ({
        selectedNodeId: state.selectedNodeId,
        lastGeneratedImage: state.lastGeneratedImage,
        // nodes & edges are NOT persisted (good)
      }),
    }
  )
);