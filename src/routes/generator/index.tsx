import { GeneratorSideBar } from "@/components/ui/generatorSidebar";
import { HistorySideBar } from "@/components/ui/historySidebar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/generator/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex gap-5 items-center w-full">
      <GeneratorSideBar />
      <div className="w-full">
        <img src="/1.png" alt="imga" className="w-full object-cover rounded-sm" />
      </div>
      <HistorySideBar />
    </div>
  );
}
