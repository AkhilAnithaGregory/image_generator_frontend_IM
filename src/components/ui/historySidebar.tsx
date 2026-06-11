import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";
import { Separator } from "./separator";

export const HistorySideBar = () => {
  const { projects, currentProjectId } = useProjectStore();
  const currentProject = projects.find((p) => p.id === currentProjectId);

  const images = currentProject?.images || [];
  const { selectedNodeId, setSelectedNodeId, setLastGeneratedImage } =
    useImageStore();

  return (
    <div className="h-screen overflow-auto w-xl text-white bg-black p-4 space-y-3">
      <h3 className="text-xl">Version History</h3>

      <ul>
        {images?.filter(Boolean).map((img) => {
          if (!img?.src) return null;
          return (
            <li key={img.id} className="mb-6">
              <div
                onClick={() => {
                  setSelectedNodeId(img.id);
                  setLastGeneratedImage(img.src);
                }}
                className={`p-2 rounded cursor-pointer ${
                  selectedNodeId === img?.id
                    ? "bg-gray-700"
                    : "hover:bg-gray-800"
                }`}
              >
                <img
                  src={img?.src}
                  className="w-full h-40 object-cover rounded"
                />

                <div className="text-sm mt-2">
                  <div className="text-blue-400">V {img.id.slice(-4)}</div>

                  <p className="text-gray-300 text-xs">{img.prompt}</p>
                </div>
              </div>

              <Separator />
            </li>
          );
        })}
      </ul>
    </div>
  );
};
