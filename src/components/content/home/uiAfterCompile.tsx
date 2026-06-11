import { useState, useRef, useEffect } from "react";
import DrawingCanvas from "@/components/ui/DrawingCanvas";
import type { LineType } from "@/components/ui/DrawingCanvas";
import { GeneratorSideBar } from "@/components/ui/generatorSidebar";
import { HistorySideBar } from "@/components/ui/historySidebar";
import LoadingText from "@/components/ui/loadingText";
import { FiDownload, FiMaximize2 } from "react-icons/fi";
import Konva from "konva";
import { LuPencil, LuEraser } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { RiDeleteBinLine } from "react-icons/ri";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";

export const UiAfterCompile = ({ revertCurrentImage }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const imgRef = useRef(null);
  const [imgSize, setImgSize] = useState({ width: 900, height: 900 });

  const [isGenerating, setIsGenerating] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [lines, setLines] = useState<LineType[]>([]);

  const { projects, currentProjectId } = useProjectStore();
  const currentProject = projects.find((p) => p.id === currentProjectId);
  const images = currentProject?.images || [];

  const latestImage = images[images.length - 1];

  /* ✅ KEEP IMAGE STORE (SELECTION ONLY) */
  const { selectedNodeId, setSelectedNodeId, lastGeneratedImage } =
    useImageStore();

  const getDrawingFile = async () => {
    if (!stageRef.current) return null;

    const stage = stageRef.current;

    const dataUrl = stage.toDataURL({
      width: stage.width(),
      height: stage.height(),
      pixelRatio: 1, // ✅ IMPORTANT
    });

    const blob = await fetch(dataUrl).then((r) => r.blob());

    return new File([blob], "drawing.png", {
      type: "image/png",
    });
  };

  useEffect(() => {
    if (!selectedNodeId && images.length > 0) {
      const last = images[images.length - 1];
      setSelectedNodeId(last.id);
    }
  }, [images]);

  useEffect(() => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();

    setImgSize({
      width: rect.width,
      height: rect.height,
    });
  }, [lastGeneratedImage, images]);

  return (
    <div className="flex gap-5 items-center w-full">
      {/* ✅ LEFT GENERATOR */}
      <GeneratorSideBar
        onRevert={() => revertCurrentImage(latestImage)}
        getDrawingFile={getDrawingFile}
        setLines={setLines}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
      />

      {/* ✅ CENTER IMAGE */}
      <div className="w-full flex justify-center">
        <div className="relative group w-fit">
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200/30 z-50">
              <LoadingText isLoading={isGenerating} />
            </div>
          )}

          <img
            ref={imgRef}
            src={
              lastGeneratedImage ||
              images.find((img) => img?.id === selectedNodeId)?.src ||
              latestImage?.src ||
              "/1.png"
            }
            className="w-225 h-225 object-contain border"
          />

          {/* ✅ DRAWING */}
          {isDrawingMode && (
            <DrawingCanvas
              stageRef={stageRef}
              width={imgSize.width}
              height={imgSize.height}
              tool={tool}
              lines={lines}
              setLines={setLines}
            />
          )}

          {/* ✅ ACTION BUTTONS */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              onClick={async () => {
                const url = latestImage?.src || lastGeneratedImage || "/1.png";
                const blob = await fetch(url).then((r) => r.blob());
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "image.png";
                link.click();
              }}
              className="bg-black text-white p-2 rounded"
            >
              <FiDownload />
            </button>

            <button
              onClick={() =>
                window.open(latestImage?.src || lastGeneratedImage, "_blank")
              }
              className="bg-black text-white p-2 rounded"
            >
              <FiMaximize2 />
            </button>
          </div>

          {/* ✅ DRAW TOOL */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2">
            {speedDialOpen && (
              <>
                <button
                  onClick={() => {
                    setIsDrawingMode(true);
                    setTool("pen");
                  }}
                  className="bg-green-600 p-2 rounded-full"
                >
                  <LuPencil />
                </button>

                <button
                  onClick={() => {
                    setIsDrawingMode(true);
                    setTool("eraser");
                  }}
                  className="bg-orange-600 p-2 rounded-full"
                >
                  <LuEraser />
                </button>

                <button
                  onClick={() => setLines([])}
                  className="bg-red-600 p-2 rounded-full"
                >
                  <RiDeleteBinLine />
                </button>
              </>
            )}

            <button
              onClick={() => setSpeedDialOpen((p) => !p)}
              className="bg-black text-white p-3 rounded-full"
            >
              {speedDialOpen ? <IoClose /> : <LuPencil />}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ HISTORY */}
      <HistorySideBar />
    </div>
  );
};
