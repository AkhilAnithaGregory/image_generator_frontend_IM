import { useImageStore } from "@/lib/store/useImageStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { createFileRoute } from "@tanstack/react-router";
import { UiBeforeCompile } from "@/components/content/home/uiBeforeCompile";
import { UiAfterCompile } from "@/components/content/home/uiAfterCompile";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { revertCurrentImage, lastGeneratedImage } = useImageStore();

  const { projects, currentProjectId } = useProjectStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const images = currentProject?.images || [];

  const latestImage = images[images.length - 1];
  const currentImage = latestImage || lastGeneratedImage;
  console.log("latestImage", latestImage?.src);
  if (!currentProjectId) {
    return <UiBeforeCompile />;
  }

  return (
    <div className="w-full">
      <UiAfterCompile revertCurrentImage={revertCurrentImage} />
    </div>
  );
}
