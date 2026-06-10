import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useProjectStore = create(
    persist(
        (set) => ({
            projects: [],
            currentProjectId: null,

            createProject: (prompt, firstImage) =>
                set((state) => {
                    const newProject = {
                        id: `project-${Date.now()}`,
                        name: prompt.slice(0, 20),
                        images: [firstImage] || [],
                    };

                    return {
                        projects: [...state.projects, newProject],
                        currentProjectId: newProject.id,
                    };
                }),

            updateProjectImages: (images) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === state.currentProjectId
                            ? { ...p, images }
                            : p
                    ),
                })),

            renameProject: (projectId, newName) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === projectId
                            ? { ...p, name: newName }
                            : p
                    ),
                })),

            addImageToProject: (image) =>
                set((state) => ({
                    projects: state.projects.map((p) =>
                        p.id === state.currentProjectId
                            ? { ...p, images: [...p.images, image] }
                            : p
                    ),
                })),

            deleteProject: (projectId) =>
                set((state) => ({
                    projects: state.projects.filter((p) => p.id !== projectId),
                    currentProjectId:
                        state.currentProjectId === projectId ? null : state.currentProjectId,
                })),

            setCurrentProject: (id) => set({ currentProjectId: id }),

            resetProject: () => set({ currentProjectId: null }),
        }),
        {
            name: "project-storage",
        }
    )
);