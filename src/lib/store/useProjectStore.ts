import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ImageItem = {
    id: string;
    src: string | null;
    prompt?: string;
    [key: string]: unknown;
};

type Project = {
    id: string;
    name: string;
    images: ImageItem[];
};

interface ProjectStoreState {
    projects: Project[];
    currentProjectId: string | null;

    createProject: (prompt: string, firstImage: ImageItem | null) => void;
    updateProjectImages: (images: ImageItem[]) => void;
    renameProject: (projectId: string, newName: string) => void;
    addImageToProject: (image: ImageItem) => void;
    deleteProject: (projectId: string) => void;
    setCurrentProject: (id: string | null) => void;
    resetProject: () => void;
}

export const useProjectStore = create<ProjectStoreState>()(
    persist(
        (set) => ({
            projects: [],
            currentProjectId: null,

            createProject: (prompt: string, firstImage: ImageItem | null) =>
                set((state) => {
                    const newProject: Project = {
                        id: `project-${Date.now()}`,
                        name: prompt.slice(0, 20),
                        images: firstImage ? [firstImage] : [],
                    };

                    return {
                        projects: [...state.projects, newProject],
                        currentProjectId: newProject.id,
                    } as Partial<ProjectStoreState> as ProjectStoreState;
                }),

            updateProjectImages: (images: ImageItem[]) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === state.currentProjectId ? { ...p, images } : p
                    ),
                })),

            renameProject: (projectId: string, newName: string) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId ? { ...p, name: newName } : p
                    ),
                })),

            addImageToProject: (image: ImageItem) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === state.currentProjectId
                            ? { ...p, images: [...p.images, image] }
                            : p
                    ),
                })),

            deleteProject: (projectId: string) =>
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== projectId),
                    currentProjectId:
                        state.currentProjectId === projectId ? null : state.currentProjectId,
                })),

            setCurrentProject: (id: string | null) => set({ currentProjectId: id }),

            resetProject: () => set({ currentProjectId: null }),
        }),
        {
            name: "project-storage",
        }
    )
);