import { useImageStore } from "@/lib/store/useImageStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { createFileRoute } from "@tanstack/react-router";
import { UiBeforeCompile } from "@/components/content/home/uiBeforeCompile";
import { UiAfterCompile } from "@/components/content/home/uiAfterCompile";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { revertCurrentImage } = useImageStore();

  const { currentProjectId } = useProjectStore();

  if (!currentProjectId) {
    return <UiBeforeCompile />;
  }

  return (
    <div className="w-full">
      <UiAfterCompile revertCurrentImage={revertCurrentImage} />
    </div>
  );
}
