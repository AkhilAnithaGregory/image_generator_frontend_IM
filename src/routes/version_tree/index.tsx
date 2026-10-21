import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type Edge,
} from "reactflow";
import type { ImageItem } from "@/lib/store/useProjectStore";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { useImageStore } from "@/lib/store/useImageStore";
import { useCompareStore } from "@/lib/store/useCompareStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import ImageDialog from "@/components/content/imageDialog";
import DefaultLayout from "@/lib/layouts/defaultLayout";
import { Button } from "@/components/ui/button";
import { LuGitBranch, LuMaximize2, LuArrowLeftRight, LuInfo, LuX } from "react-icons/lu";

export const Route = createFileRoute("/version_tree/")({
  component: RouteComponent,
});

const nodeWidth = 180;
const nodeHeight = 130;

const CustomNode: React.FC<{ data: { img?: ImageItem } }> = ({ data }) => {
  const getBorderColor = () => {
    if (!data.img?.parentId) return "rgba(255, 255, 255, 0.4)";

    const hasDrawing = !!data.img?.drawingImage;
    const hasUpload = !!data.img?.uploadedImages?.length;
    const hasPromptOnly = !hasDrawing && !hasUpload && !!data.img?.prompt;

    if (hasDrawing && hasUpload) return "#f97316"; // orange
    if (hasDrawing) return "#ef4444"; // red
    if (hasUpload) return "#3b82f6"; // blue
    if (hasPromptOnly) return "#10b981"; // green

    return "rgba(255, 255, 255, 0.2)";
  };

  return (
    <div
      style={{
        width: nodeWidth,
        borderRadius: 14,
        border: `2px solid ${getBorderColor()}`,
        overflow: "hidden",
        background: "#0f131d",
        boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: "pointer",
      }}
      className="hover:scale-105 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !w-2 !h-2" />

      <div style={{ width: "100%", height: 86, overflow: "hidden", background: "#080b12" }}>
        {data.img?.src ? (
          <img
            src={data.img.src}
            alt="img"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
            No image
          </div>
        )}
      </div>

      <div
        style={{
          padding: "6px 10px",
          fontSize: 11,
          color: "#d1d5db",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          background: "#0f131d",
        }}
      >
        {data.img?.prompt || "Generated Image"}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !w-2 !h-2" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

const getLayoutedElements = (nodes: Node[], edges: Edge[]): Node[] => {
  if (nodes.length === 0) return [];

  try {
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: "TB", nodesep: 50, ranksep: 60 });

    nodes.forEach((node) => {
      graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
      if (edge.source && edge.target && edge.source !== edge.target) {
        graph.setEdge(edge.source, edge.target);
      }
    });

    dagre.layout(graph);

    return nodes.map((node, index) => {
      const pos: any = graph.node(node.id);
      if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
        return {
          ...node,
          position: {
            x: pos.x - nodeWidth / 2,
            y: pos.y - nodeHeight / 2,
          },
        };
      }
      return {
        ...node,
        position: {
          x: (index % 4) * (nodeWidth + 40),
          y: Math.floor(index / 4) * (nodeHeight + 60),
        },
      };
    });
  } catch (err) {
    console.warn("Dagre layout error, using fallback grid:", err);
    return nodes.map((node, index) => ({
      ...node,
      position: {
        x: (index % 4) * (nodeWidth + 40),
        y: Math.floor(index / 4) * (nodeHeight + 60),
      },
    }));
  }
};

const buildGraph = (images: ImageItem[]): { nodes: Node[]; edges: Edge[] } => {
  const validImages = (images || []).filter((img) => img && img.id);
  const validIds = new Set(validImages.map((img) => img.id));

  const nodes: Node[] = validImages.map((img) => ({
    id: img.id,
    type: "custom",
    position: { x: 0, y: 0 },
    data: { img },
  }));

  const edges: Edge[] = validImages
    .filter(
      (img) =>
        img.parentId &&
        img.parentId !== img.id &&
        validIds.has(img.parentId) &&
        validIds.has(img.id)
    )
    .map((img) => ({
      id: `e-${img.parentId}-${img.id}`,
      source: img.parentId!,
      target: img.id,
      style: { stroke: "#60a5fa", strokeWidth: 2 },
      animated: true,
    }));

  return { nodes, edges };
};

function RouteComponent() {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { projects, currentProjectId } = useProjectStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const images = useMemo(() => currentProject?.images || [], [currentProject?.images]);

  const { selectedNodeId, setSelectedNodeId, setLastGeneratedImage } =
    useImageStore();

  const { compareList, addToCompare, removeFromCompare } = useCompareStore();

  const navigate = useNavigate();

  const [menu, setMenu] = useState<{ x: number; y: number; node: any } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageItem | null>(null);
  const [showMobileLegend, setShowMobileLegend] = useState(false);

  // Safe cycle-protected filtering
  const filteredImages = useMemo(() => {
    if (!selectedNodeId) return images;

    const result = new Map<string, ImageItem>();
    const visited = new Set<string>();

    let current: string | null = selectedNodeId;
    while (current && !visited.has(current)) {
      visited.add(current);
      const node = images.find((i) => i?.id === current);
      if (!node) break;

      result.set(node.id, node);
      if (!node.parentId || node.parentId === node.id) break;
      current = node.parentId;
    }

    const visitedChildren = new Set<string>();
    const addChildren = (id: string) => {
      images.forEach((img) => {
        if (
          img?.parentId === id &&
          img.id !== id &&
          !visitedChildren.has(img.id)
        ) {
          visitedChildren.add(img.id);
          result.set(img.id, img);
          addChildren(img.id);
        }
      });
    };

    addChildren(selectedNodeId);

    return Array.from(result.values());
  }, [images, selectedNodeId]);

  const { nodes, edges } = useMemo(() => {
    return buildGraph(filteredImages);
  }, [filteredImages]);

  const layoutedNodes = useMemo(() => {
    return getLayoutedElements(nodes, edges);
  }, [nodes, edges]);

  const handleFilterBranch = () => {
    if (!menu?.node?.data?.img) return;
    const img = menu.node.data.img;
    setSelectedNodeId(img.id);
    if (img.src) {
      setLastGeneratedImage(img.src);
    }
    setMenu(null);
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    event.stopPropagation();
    setMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  };

  const MenuItem = ({ onClick, label, icon }: { onClick: () => void; label: string; icon?: React.ReactNode }) => {
    return (
      <button
        onClick={onClick}
        className="w-full px-3.5 py-2 text-xs flex items-center gap-2 text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors text-left"
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  const handleCompare = () => {
    if (menu?.node?.data?.img) {
      addToCompare(menu.node.data.img);
    }
    setMenu(null);
  };

  const handleView = () => {
    if (menu?.node?.data?.img) {
      setSelectedImage(menu.node.data.img);
      setDialogOpen(true);
    }
    setMenu(null);
  };

  const goToCompare = () => {
    navigate({ to: "/version_tree/compare" });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <DefaultLayout>
      <div className="h-full w-full relative bg-[#080b12] overflow-hidden" onClick={() => setMenu(null)}>
        {/* Top Control Bar */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          {selectedNodeId && (
            <Button
              onClick={() => setSelectedNodeId(null)}
              className="bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] text-white text-xs px-3.5 py-2 rounded-xl backdrop-blur-md shadow-lg transition-all"
            >
              <LuGitBranch size={14} className="mr-1.5 text-blue-400" />
              Show Full Tree
            </Button>
          )}
        </div>

        {/* Legend Button (Mobile) & Full Legend (Desktop or Mobile Opened) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end">
          {/* Mobile Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMobileLegend((prev) => !prev);
            }}
            className="sm:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0f131d]/90 backdrop-blur-md border border-white/[0.1] text-xs text-gray-300 hover:text-white shadow-xl transition-all cursor-pointer"
          >
            <LuInfo size={13} className="text-blue-400" />
            <span>Legend</span>
          </button>

          {/* Legend Panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`mt-2 sm:mt-0 bg-[#0f131d]/95 backdrop-blur-md border border-white/[0.08] rounded-xl p-3 text-xs text-gray-300 shadow-2xl transition-all ${
              showMobileLegend ? "block" : "hidden sm:block"
            }`}
          >
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="font-medium text-white text-[11px] uppercase tracking-wider text-gray-400">
                Legend
              </span>
              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={() => setShowMobileLegend(false)}
                className="sm:hidden text-gray-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <LuX size={13} />
              </button>
            </div>
            <div className="space-y-1.5">
              {[
                { color: "rgba(255,255,255,0.4)", label: "Root Image" },
                { color: "#10b981", label: "Prompt Only" },
                { color: "#ef4444", label: "Drawing Mask" },
                { color: "#3b82f6", label: "Reference Upload" },
                { color: "#f97316", label: "Drawing + Upload" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm border-2 inline-block shrink-0"
                    style={{ borderColor: item.color }}
                  />
                  <span className="text-[11px] text-gray-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Flow Canvas or Empty State */}
        {images.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3 text-gray-400">
              <LuGitBranch size={28} />
            </div>
            <p className="text-sm font-medium text-gray-300">No versions yet</p>
            <p className="text-xs text-gray-500 mt-1 max-w-xs">
              Generate images in the project to see the version history tree branches here.
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={layoutedNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
            onNodeClick={handleNodeClick}
            defaultEdgeOptions={{
              style: { stroke: "#3b82f6", strokeWidth: 2 },
            }}
          >
            <Background color="#1f2937" gap={24} size={1} />
            <Controls className="!bg-[#0f131d] !border-white/[0.08] !text-white !rounded-xl !overflow-hidden [&>button]:!bg-[#0f131d] [&>button]:!border-white/[0.08] [&>button]:!text-gray-300 hover:[&>button]:!text-white" />
          </ReactFlow>
        )}

        {/* Node Context Menu */}
        {menu && (
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menu.y,
              left: menu.x,
              zIndex: 3000,
            }}
            className="bg-[#0f131d]/95 backdrop-blur-md rounded-xl shadow-2xl py-1.5 min-w-[150px] border border-white/[0.1] animate-in fade-in zoom-in-95 duration-100"
          >
            <MenuItem onClick={handleView} label="View Full" icon={<LuMaximize2 size={13} />} />
            <MenuItem onClick={handleFilterBranch} label="Filter Branch" icon={<LuGitBranch size={13} />} />
            <MenuItem onClick={handleCompare} label="Add to Compare" icon={<LuArrowLeftRight size={13} />} />
          </div>
        )}

        {/* Comparison Floating Bar */}
        {compareList.length > 0 && (
          <div
            className="fixed bottom-16 sm:bottom-6 left-1/2 -translate-x-1/2 bg-[#0f131d]/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 flex items-center gap-3 sm:gap-4 shadow-2xl border border-white/[0.1] z-40 max-w-[92vw] overflow-x-auto"
          >
            <div className="flex gap-2">
              {compareList.map((img) => (
                <div
                  key={img.id}
                  className="relative rounded-lg overflow-hidden border border-white/[0.15] w-14 h-14 bg-black"
                >
                  <img src={img.src || ""} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeFromCompare(img.id)}
                    className="absolute top-1 right-1 bg-black/70 hover:bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {compareList.length === 1 && (
              <span className="text-xs text-gray-400 pr-2">Select one more image</span>
            )}

            {compareList.length >= 2 && (
              <button
                onClick={goToCompare}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center gap-1.5"
              >
                <span>Compare</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}

        <ImageDialog
          open={dialogOpen}
          setOpen={setDialogOpen}
          selectedImage={selectedImage}
        />
      </div>
    </DefaultLayout>
  );
}
