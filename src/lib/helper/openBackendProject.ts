import * as api from "@/lib/api";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";

export const openBackendProject = async (backendProject: any) => {
  const projectStore = useProjectStore.getState();
  const imageStore = useImageStore.getState();

  const draftProjectId = `backend-${backendProject._id}`;

  const exists = projectStore.projects.some(
    (p) => p.id === draftProjectId
  );

  if (!exists) {
    projectStore.createDraftProjectWithId(
      draftProjectId,
      backendProject.name,
      []
    );
  } else {
    projectStore.setCurrentProject(draftProjectId);
  }

  const data = await api.pullLatest(
    backendProject.liveBranch
  );

  projectStore.updateProjectImages(data.state.images);

  projectStore.setBackendProject(
    backendProject._id,
    backendProject.liveBranch,
    data.version
  );

  const last = data.state.images.at(-1);
  if (last) {
    imageStore.setSelectedNodeId(last.id);
    imageStore.setLastGeneratedImage(last.src);
  }
};