import { useEffect } from "react";
import { useImageStore } from "@/lib/store/useImageStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { createFileRoute } from "@tanstack/react-router";
import { UiBeforeCompile } from "@/components/content/home/uiBeforeCompile";
import { UiAfterCompile } from "@/components/content/home/uiAfterCompile";
import useInitAuth from "@/lib/context/useInitAuth";
import DefaultLayout from "@/lib/layouts/defaultLayout";
import { useAuthStore } from "@/lib/store/authStore";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useInitAuth();

  const { revertCurrentImage } = useImageStore();
  const {
    currentProjectId,
    projects,
    setCurrentProject,
    createDraftProjectWithId,
    updateProjectImages,
    setBackendProject,
  } = useProjectStore();

  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;

  const { data: backendProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    enabled: isLoggedIn,
  });

  useEffect(() => {
    if (isLoggedIn && backendProjects.length === 1 && !currentProjectId) {
      const project = backendProjects[0];
      const draftProjectId = `backend-${project._id}`;

      const exists = projects.some((p) => p.id === draftProjectId);

      if (!exists) {
        createDraftProjectWithId(draftProjectId, project.name, []);
      } else {
        setCurrentProject(draftProjectId);
      }

      api.pullLatest(project.liveBranch).then((data) => {
        updateProjectImages(data.state.images);
        setBackendProject(project._id, project.liveBranch, data.version);
      });
    }

    if (!isLoggedIn && projects.length === 1 && !currentProjectId) {
      setCurrentProject(projects[0].id);
    }
  }, [isLoggedIn, backendProjects, projects, currentProjectId]);

  if (!currentProjectId) {
    return <UiBeforeCompile />;
  }

  return (
    <DefaultLayout>
      <UiAfterCompile revertCurrentImage={revertCurrentImage} />
    </DefaultLayout>
  );
}
