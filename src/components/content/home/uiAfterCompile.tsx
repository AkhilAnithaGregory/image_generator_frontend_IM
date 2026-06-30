import { useState, useRef, useEffect } from "react";
import DrawingCanvas from "@/components/ui/DrawingCanvas";
import type { LineType } from "@/components/ui/DrawingCanvas";
import { GeneratorSideBar } from "@/components/content/home/generatorSidebar";
import { HistorySideBar } from "@/components/content/home/historySidebar";
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

  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null);

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
    if (!images.length) return;

    const last = images[images.length - 1];

    // Only set when selection is explicitly null to avoid update loops
    if (selectedNodeId === null && last?.id) {
      setSelectedNodeId(last.id);
    }
    // intentionally not updating when selectedNodeId is undefined/empty string
  }, [images, selectedNodeId]);

  useEffect(() => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();

    // only update state when dimensions actually change
    setImgSize((prev) => {
      if (prev.width === rect.width && prev.height === rect.height) return prev;
      return { width: rect.width, height: rect.height };
    });
  }, [lastGeneratedImage, images]);

  const selectedImage = images.find((img) => img?.id === selectedNodeId);

  const imageSrc =
    lastGeneratedImage || selectedImage?.src || latestImage?.src || "/1.png";

  const selectedBrush = speedDialOpen ? (
    <IoClose />
  ) : tool === "pen" ? (
    <LuPencil />
  ) : tool === "eraser" ? (
    <LuEraser />
  ) : (
    <IoClose />
  );

  return (
    <div className="flex gap-5 items-center w-full">
      <GeneratorSideBar
        onRevert={() => revertCurrentImage(latestImage)}
        getDrawingFile={getDrawingFile}
        lines={lines}
        setLines={setLines}
        isGenerating={isGenerating}
        setIsGenerating={setIsGenerating}
        showCommitDialog={showCommitDialog}
        setShowCommitDialog={setShowCommitDialog}
      />

      {/* ✅ CENTER IMAGE */}
      <div className="w-full flex justify-center">
        <div className="relative group w-fit">
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200/80 z-50">
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
                const url = imageSrc;
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
              onClick={() => window.open(imageSrc, "_blank")}
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
                    setSpeedDialOpen(false);
                  }}
                  className="bg-green-600 p-2 rounded-full hover:cursor-pointer"
                >
                  <LuPencil size={15} color="white" />
                </button>

                <button
                  onClick={() => {
                    setIsDrawingMode(true);
                    setTool("eraser");
                    setSpeedDialOpen(false);
                  }}
                  className="bg-orange-600 p-2 rounded-full hover:cursor-pointer"
                >
                  <LuEraser size={15} color="white" />
                </button>

                <button
                  onClick={() => {
                    setLines([]);
                    setSpeedDialOpen(false);
                  }}
                  className="bg-red-600 p-2 rounded-full hover:cursor-pointer"
                >
                  <RiDeleteBinLine size={15} color="white" />
                </button>
              </>
            )}

            <button
              onClick={() => setSpeedDialOpen((p) => !p)}
              className="bg-white text-black p-3 rounded-full shadow-2xl"
            >
              {selectedBrush}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ HISTORY */}
      <HistorySideBar
        onRequestPush={(branchId) => {
          setPendingBranchId(branchId);
          setShowCommitDialog(true);
        }}
      />
    </div>
  );
};
