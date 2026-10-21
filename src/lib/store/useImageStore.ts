import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useProjectStore } from "./useProjectStore";

type ImageItem = {
  id: string;
  src: string | null;
  [key: string]: unknown;
};

type NodeItem = {
  id: string;
  data?: unknown;
  position?: { x: number; y: number };
  [key: string]: unknown;
};

type EdgeItem = {
  id: string;
  source: string;
  target: string;
  [key: string]: unknown;
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
  editingImageId: string | null;

  setGraph: (nodes: NodeItem[], edges: EdgeItem[]) => void;
  addImage: (image: ImageItem) => void;
  setSelectedNodeId: (id: string | null) => void;
  setLastGeneratedImage: (img: string | null) => void;
  setEditingImageId: (id: string | null) => void;
  clearEditing: () => void;
  revertCurrentImage: (currentImg: ImageItem | null) => void;
  resetImageSelection: () => void;
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
      editingImageId: null,

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

      setEditingImageId: (id: string | null) =>
        set({
          editingImageId: id,
        }),

      clearEditing: () =>
        set({
          editingImageId: null,
        }),

      resetImageSelection: () =>
        set({
          selectedNodeId: null,
          lastGeneratedImage: null,
          editingImageId: null,
        }),
        
      revertCurrentImage: (currentImg: ImageItem | null) => {
        const projectStore = useProjectStore.getState();
        const currentProject = projectStore.projects.find(
          (p) => p.id === projectStore.currentProjectId
        );
        if (!currentProject || !currentProject.images.length) return;

        const target =
          currentImg ||
          (get().selectedNodeId
            ? currentProject.images.find((img) => img.id === get().selectedNodeId)
            : null) ||
          currentProject.images[currentProject.images.length - 1];

        if (!target) return;

        const parent = target.parentId
          ? currentProject.images.find((img) => img.id === target.parentId)
          : null;
        const idx = currentProject.images.findIndex((img) => img.id === target.id);
        const prev = parent || (idx > 0 ? currentProject.images[idx - 1] : null);

        projectStore.removeImageFromProject(target.id);
        projectStore.setHasUnsavedChanges(true);

        set({
          selectedNodeId: prev?.id ?? null,
          lastGeneratedImage: (prev?.src as string) ?? null,
          editingImageId: null,
        });
      },

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
        selectedNodeId: state.selectedNodeId,
        lastGeneratedImage: state.lastGeneratedImage,
      }),
    }
  )
);