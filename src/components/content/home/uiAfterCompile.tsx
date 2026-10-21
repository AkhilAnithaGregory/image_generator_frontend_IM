import { useState, useRef, useEffect } from "react";
import DrawingCanvas from "@/components/ui/DrawingCanvas";
import type { LineType } from "@/components/ui/DrawingCanvas";
import { GeneratorSideBar } from "@/components/content/home/generatorSidebar";
import { HistorySideBar } from "@/components/content/home/historySidebar";
import LoadingText from "@/components/ui/loadingText";
import { FiDownload, FiMaximize2 } from "react-icons/fi";
import Konva from "konva";
import { LuPencil, LuEraser, LuSlidersHorizontal, LuImage, LuHistory } from "react-icons/lu";
import { IoClose } from "react-icons/io5";
import { RiDeleteBinLine } from "react-icons/ri";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";
import { CiImageOff } from "react-icons/ci";

export const UiAfterCompile = ({ revertCurrentImage }: { revertCurrentImage?: (img: any) => void }) => {
  const stageRef = useRef<Konva.Stage>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgSize, setImgSize] = useState({ width: 900, height: 900 });

  const [isGenerating, setIsGenerating] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [lines, setLines] = useState<LineType[]>([]);

  const [showCommitDialog, setShowCommitDialog] = useState(false);

  // Mobile active panel tab
  const [mobileTab, setMobileTab] = useState<"generator" | "canvas" | "history">("canvas");

  const { projects, currentProjectId } = useProjectStore();
  const currentProject = projects.find((p) => p.id === currentProjectId);
  const images = currentProject?.images || [];

  const latestImage = images[images.length - 1];

  const { selectedNodeId, setSelectedNodeId, lastGeneratedImage, editingImageId } =
    useImageStore();

  const getDrawingFile = async () => {
    if (!stageRef.current) return null;

    const stage = stageRef.current;

    const dataUrl = stage.toDataURL({
      width: stage.width(),
      height: stage.height(),
      pixelRatio: 1,
    });

    const blob = await fetch(dataUrl).then((r) => r.blob());

    return new File([blob], "drawing.png", {
      type: "image/png",
    });
  };

  useEffect(() => {
    if (!images.length) return;

    const last = images[images.length - 1];

    if (selectedNodeId === null && last?.id) {
      setSelectedNodeId(last.id);
    }
  }, [images, selectedNodeId, setSelectedNodeId]);

  useEffect(() => {
    if (isGenerating) {
      setMobileTab("canvas");
    }
  }, [isGenerating]);

  useEffect(() => {
    if (editingImageId) {
      setMobileTab("generator");
    }
  }, [editingImageId]);

  useEffect(() => {
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();

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

  const generatedImage =
    lastGeneratedImage ||
    images.find((img) => img?.id === selectedNodeId)?.src ||
    latestImage?.src;

  return (
    <div className="flex flex-col lg:flex-row w-full h-full relative overflow-hidden bg-[#080b12]">
      {/* Mobile Top Navigation Tabs */}
      <div className="lg:hidden flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-[#0c0f18]/90 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-1 w-full justify-around">
          <button
            type="button"
            onClick={() => setMobileTab("generator")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${mobileTab === "generator"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            <LuSlidersHorizontal size={13} />
            <span>Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("canvas")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${mobileTab === "canvas"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            <LuImage size={13} />
            <span>Canvas</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab("history")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${mobileTab === "history"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
              }`}
          >
            <LuHistory size={13} />
            <span>History</span>
            <span className="text-[10px] opacity-75 font-mono ml-0.5">({images.length})</span>
          </button>
        </div>
      </div>

      {/* Generator Sidebar (always visible on desktop, tab-controlled on mobile) */}
      <div
        className={`h-full min-h-0 overflow-hidden ${mobileTab === "generator" ? "flex flex-1 w-full" : "hidden lg:flex"
          }`}
      >
        <GeneratorSideBar
          onRevert={() => revertCurrentImage?.(latestImage)}
          getDrawingFile={getDrawingFile}
          lines={lines}
          setLines={setLines}
          isGenerating={isGenerating}
          setIsGenerating={setIsGenerating}
          showCommitDialog={showCommitDialog}
          setShowCommitDialog={setShowCommitDialog}
        />
      </div>

      {/* Main Canvas Area */}
      <div
        className={`flex-1 flex items-center justify-center relative p-3 sm:p-6 lg:p-8 overflow-hidden h-full ${mobileTab === "canvas" ? "flex" : "hidden lg:flex"
          }`}
      >
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative w-full max-w-[800px] aspect-square group flex items-center justify-center">
          {/* Beautiful Generating overlay */}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/85 backdrop-blur-md z-50 rounded-2xl border border-white/[0.08] shadow-2xl">
              <LoadingText isLoading={isGenerating} />
            </div>
          )}

          {/* Editing indicator on canvas */}
          {editingImageId && !isGenerating && generatedImage && (
            <div className="absolute -top-9 left-2 flex items-center gap-2 z-30">
              <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full shadow-sm">
                ✏️ Editing Image — Adjust prompt & generate to update
              </span>
            </div>
          )}

          {generatedImage && (
            <img
              ref={imgRef}
              src={
                lastGeneratedImage ||
                images.find((img) => img?.id === selectedNodeId)?.src ||
                latestImage?.src ||
                ""
              }
              alt="Generated Result"
              className={`w-full h-full object-contain rounded-2xl transition-all duration-300 ${editingImageId
                  ? "ring-2 ring-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.1)]"
                  : "shadow-[0_0_80px_rgba(0,0,0,0.5)]"
                }`}
            />
          )}

          {isDrawingMode && generatedImage && (
            <DrawingCanvas
              stageRef={stageRef}
              width={imgSize.width}
              height={imgSize.height}
              tool={tool}
              lines={lines}
              setLines={setLines}
            />
          )}

          {/* Action buttons - top right */}
          {generatedImage && !isGenerating && (
            <div className="absolute top-3 right-3 flex gap-2 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-20">
              <button
                type="button"
                onClick={async () => {
                  const url = imageSrc;
                  const blob = await fetch(url).then((r) => r.blob());
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = `generation-${Date.now()}.png`;
                  link.click();
                }}
                title="Download full resolution"
                className="bg-black/70 backdrop-blur-md text-white p-2.5 rounded-xl hover:bg-black/90 transition-colors border border-white/10 shadow-lg cursor-pointer"
              >
                <FiDownload size={15} />
              </button>

              <button
                type="button"
                onClick={() => window.open(imageSrc, "_blank")}
                title="Open in new tab"
                className="bg-black/70 backdrop-blur-md text-white p-2.5 rounded-xl hover:bg-black/90 transition-colors border border-white/10 shadow-lg cursor-pointer"
              >
                <FiMaximize2 size={15} />
              </button>
            </div>
          )}

          {/* Drawing tools - bottom left */}
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 z-20">
            {speedDialOpen && generatedImage && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawingMode(true);
                    setTool("pen");
                    setSpeedDialOpen(false);
                  }}
                  title="Drawing mask pen"
                  className="bg-emerald-500/90 p-2.5 rounded-xl hover:bg-emerald-500 transition-colors cursor-pointer shadow-lg"
                >
                  <LuPencil size={15} color="white" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDrawingMode(true);
                    setTool("eraser");
                    setSpeedDialOpen(false);
                  }}
                  title="Eraser"
                  className="bg-orange-500/90 p-2.5 rounded-xl hover:bg-orange-500 transition-colors cursor-pointer shadow-lg"
                >
                  <LuEraser size={15} color="white" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLines([]);
                    setSpeedDialOpen(false);
                  }}
                  title="Clear drawing mask"
                  className="bg-red-500/90 p-2.5 rounded-xl hover:bg-red-500 transition-colors cursor-pointer shadow-lg"
                >
                  <RiDeleteBinLine size={15} color="white" />
                </button>
              </>
            )}

            {generatedImage && !isGenerating && (
              <button
                type="button"
                onClick={() => setSpeedDialOpen((p) => !p)}
                title="Mask drawing tools"
                className="bg-white/90 text-black p-3 rounded-xl shadow-2xl hover:bg-white transition-colors cursor-pointer"
              >
                {selectedBrush}
              </button>
            )}
          </div>

          {/* Empty state */}
          {!generatedImage && !isGenerating && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500 p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-400">
                <CiImageOff size={36} />
              </div>
              <div>
                <p className="text-base font-medium text-gray-300">No Image Yet</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Enter a prompt in the Studio panel and tap Generate.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Sidebar (always visible on desktop, tab-controlled on mobile) */}
      <div
        className={`h-full min-h-0 overflow-hidden ${mobileTab === "history" ? "flex flex-1 w-full" : "hidden lg:flex"
          }`}
      >
        <HistorySideBar />
      </div>
    </div>
  );
};
