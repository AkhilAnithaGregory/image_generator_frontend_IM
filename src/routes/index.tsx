import { useImageStore } from "@/lib/store/useImageStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { createFileRoute } from "@tanstack/react-router";
import { UiBeforeCompile } from "@/components/content/home/uiBeforeCompile";
import { UiAfterCompile } from "@/components/content/home/uiAfterCompile";
import useInitAuth from "@/lib/context/useInitAuth";
import DefaultLayout from "@/lib/layouts/defaultLayout";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useInitAuth();
  const { revertCurrentImage } = useImageStore();

  const { currentProjectId } = useProjectStore();

  if (!currentProjectId) {
    return <UiBeforeCompile />;
  }

  return (
    <DefaultLayout>
      <UiAfterCompile revertCurrentImage={revertCurrentImage} />
    </DefaultLayout>
  );
}
