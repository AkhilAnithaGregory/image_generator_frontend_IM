import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ImageItem = {
  id: string;
  src: string | null;
  prompt?: string;
  [key: string]: unknown;
};

type Project = {
  id: string; // draft ID
  name: string;
  images: ImageItem[];
};

interface ProjectStoreState {
  /* ---------------- Draft state ---------------- */
  projects: Project[];
  currentProjectId: string | null;

  /* ---------------- Live backend state ---------------- */
  backendProjectId?: string;
  currentBranchId?: string;
  lastKnownVersion?: number;

  hasUnsavedChanges: boolean;

  /* ---------------- Draft actions ---------------- */
  createProject: (prompt: string, firstImage: ImageItem | null) => void;
  updateProjectImages: (images: ImageItem[]) => void;
  renameProject: (projectId: string, newName: string) => void;
  addImageToProject: (image: ImageItem) => void;
  deleteProject: (projectId: string) => void;
  setCurrentProject: (id: string | null) => void;
  resetProject: () => void;

  /* ---------------- Live actions ---------------- */
  setBackendProject: (
    projectId: string,
    branchId: string,
    version: number
  ) => void;

  setCurrentBranchId: (branchId: string) => void; // ✅ MISSING BEFORE
  setLastKnownVersion: (v: number) => void;
  setHasUnsavedChanges: (v: boolean) => void;
}

export const useProjectStore = create<ProjectStoreState>()(
  persist(
    (set) => ({
      /* ---------------- Initial state ---------------- */
      projects: [],
      currentProjectId: null,

      backendProjectId: undefined,
      currentBranchId: undefined,
      lastKnownVersion: undefined,

      hasUnsavedChanges: false,

      /* ---------------- Draft actions ---------------- */
      createProject: (prompt, firstImage) =>
        set((state) => {
          const newProject: Project = {
            id: `project-${Date.now()}`,
            name: prompt.slice(0, 20),
            images: firstImage ? [firstImage] : [],
          };

          return {
            projects: [...state.projects, newProject],
            currentProjectId: newProject.id,
          };
        }),

      updateProjectImages: (images) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId ? { ...p, images } : p
          ),
        })),

      renameProject: (projectId, newName) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, name: newName } : p
          ),
        })),

      addImageToProject: (image) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === state.currentProjectId
              ? { ...p, images: [...p.images, image] }
              : p
          ),
          hasUnsavedChanges: true,
        })),

      createDraftProjectWithId: (
        id: string,
        name: string,
        images: ImageItem[] = []
      ) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id,
              name,
              images,
            },
          ],
          currentProjectId: id,
        })),

      resetLiveContext: () =>
        set({
          backendProjectId: undefined,
          currentBranchId: undefined,
          lastKnownVersion: undefined,
          hasUnsavedChanges: false,
        }),
      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProjectId:
            state.currentProjectId === projectId
              ? null
              : state.currentProjectId,
        })),

      setCurrentProject: (id) => set({ currentProjectId: id }),

      resetProject: () =>
        set({
          currentProjectId: null,
          backendProjectId: undefined,
          currentBranchId: undefined,
          lastKnownVersion: undefined,
          hasUnsavedChanges: false,
        }),

      /* ---------------- Live actions ---------------- */
      setBackendProject: (projectId, branchId, version) =>
        set({
          backendProjectId: projectId,
          currentBranchId: branchId,
          lastKnownVersion: version,
          hasUnsavedChanges: false,
        }),

      setCurrentBranchId: (branchId) =>
        set({
          currentBranchId: branchId,
        }),

      setLastKnownVersion: (v) =>
        set({
          lastKnownVersion: v,
        }),

      setHasUnsavedChanges: (v) =>
        set({
          hasUnsavedChanges: v,
        }),
    }),
    {
      name: "project-storage",
    }
  )
);