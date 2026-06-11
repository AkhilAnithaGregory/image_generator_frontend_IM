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

export const Route = createFileRoute("/version_tree/")({
  component: RouteComponent,
});

const nodeWidth = 160;
const nodeHeight = 100;

const CustomNode: React.FC<{ data: { img?: ImageItem } }> = ({ data }) => {
  return (
    <div
      style={{
        width: 160,
        borderRadius: 12,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        transition: "all 0.2s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px) scale(1.02)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
      }}
    >
      <Handle type="target" position={Position.Top} />

      <div style={{ width: "100%", height: 90, overflow: "hidden" }}>
        <img
          src={data.img?.src || ""}
          alt="img"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      <div
        style={{
          padding: "6px 8px",
          fontSize: 12,
          color: "#333",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {data.img?.prompt || "Generated Image"}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const getLayoutedElements = (nodes: Node[], edges: Edge[]): Node[] => {
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: "TB" });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const pos: any = graph.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    };
  });
};

const isCycle = (
  images: ImageItem[],
  sourceId: string,
  targetId: string,
): boolean => {
  let current: string | null | undefined = targetId;

  while (current) {
    if (current === sourceId) return true;
    current = images.find((i) => i.id === current)?.parentId;
  }
  return false;
};

const moveSubtree = (
  images: ImageItem[],
  sourceId: string,
  newParentId: string,
): ImageItem[] => {
  const map = new Map(images.map((img) => [img.id, { ...img }]));

  const update = (id: string) => {
    const node = map.get(id);
    if (!node) return;

    if (id === sourceId) {
      (node as ImageItem).parentId = newParentId;
    }

    images.forEach((child) => {
      if (child.parentId === id) {
        update(child.id);
      }
    });
  };

  update(sourceId);

  return Array.from(map.values()) as ImageItem[];
};

const buildGraph = (
  images: ImageItem[],
  selectedNodeId: string | null,
  forkSource: ImageItem | null,
): { nodes: Node[]; edges: Edge[] } => ({
  nodes: images.map((img) => ({
    id: img?.id,
    type: "custom",
    position: { x: 0, y: 0 },
    data: { img },
    style: {
      border:
        img?.id === selectedNodeId
          ? "2px solid blue"
          : img?.id === forkSource?.id
            ? "2px solid red"
            : "1px solid #333",
      transition: "all 0.3s ease",
    },
  })),
  edges: images
    .filter((img) => img?.parentId)
    .map((img) => ({
      id: `e-${img.parentId}-${img.id}`,
      source: img.parentId,
      target: img.id,
    })),
});

function RouteComponent() {
  const menuRef = useRef(null);
  const { projects, currentProjectId, updateProjectImages } = useProjectStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const images = currentProject?.images || [];

  const { selectedNodeId, setSelectedNodeId, setLastGeneratedImage } =
    useImageStore();

  const { compareList, addToCompare, removeFromCompare } = useCompareStore();

  const navigate = useNavigate();

  const [menu, setMenu] = useState(null);
  const [forkSource, setForkSource] = useState(null);
  const [isForkMode, setIsForkMode] = useState(false);
  const [history, setHistory] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const nodeTypes = { custom: CustomNode };

  const filteredImages = useMemo(() => {
    if (!selectedNodeId) return images;

    const result = new Map();

    let current = selectedNodeId;
    while (current) {
      const node = images?.find((i) => i?.id === current);
      if (!node) break;

      result.set(node.id, node);
      current = node.parentId;
    }

    const addChildren = (id) => {
      images.forEach((img) => {
        if (img?.parentId === id) {
          result.set(img.id, img);
          addChildren(img.id);
        }
      });
    };

    addChildren(selectedNodeId);

    return Array.from(result.values());
  }, [images, selectedNodeId]);

  const { nodes, edges } = useMemo(() => {
    return buildGraph(filteredImages, selectedNodeId, forkSource);
  }, [filteredImages, selectedNodeId, forkSource]);

  const layoutedNodes = useMemo(() => {
    return getLayoutedElements(nodes, edges);
  }, [nodes, edges]);

  const handleFilterBranch = () => {
    const img = menu.node.data.img;
    setSelectedNodeId(img.id);
    setLastGeneratedImage(img.src);
    setMenu(null);
  };

  const handleFork = () => {
    const img = menu.node.data.img;
    setForkSource(img);
    setIsForkMode(true);
    setMenu(null);
  };

  const handleForkMerge = (targetImg) => {
    if (!forkSource) return;

    if (isCycle(images, forkSource.id, targetImg.id)) {
      alert("Invalid move (cycle)");
      return;
    }

    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(images))]);

    const updatedImages = moveSubtree(images, forkSource.id, targetImg.id);

    updateProjectImages(updatedImages);

    setSelectedNodeId(targetImg.id);
    setLastGeneratedImage(targetImg.src);

    setForkSource(null);
    setIsForkMode(false);
  };

  const handleUndo = () => {
    if (!history.length) return;

    const prev = history[history.length - 1];

    updateProjectImages(prev);

    setHistory((h) => h.slice(0, -1));
  };

  const handleNodeClick = (event, node) => {
    const img = node.data.img;

    if (isForkMode) {
      handleForkMerge(img);
      return;
    }

    setMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  };

  const MenuItem = ({ onClick, label }) => {
    return (
      <div
        onClick={onClick}
        style={{
          padding: "8px 14px",
          fontSize: 14,
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#f3f4f6";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {label}
      </div>
    );
  };

  const handleCompare = () => {
    addToCompare(menu.node.data.img);
    setMenu(null);
  };

  const handleView = () => {
    setSelectedImage(menu.node.data.img);
    setDialogOpen(true);
    setMenu(null);
  };

  const goToCompare = () => {
    navigate({ to: "/version_tree/compare" });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!currentProjectId) return;

    if (!images.length) {
      setSelectedNodeId(null);
      return;
    }

    const last = images[images.length - 1];

    setSelectedNodeId(last.id);
    setLastGeneratedImage(last?.src);
  }, [currentProjectId, images]);

  return (
    <div className="h-full w-full relative">
      <button
        onClick={handleUndo}
        style={{ position: "absolute", top: 10, right: 120, zIndex: 1000 }}
      >
        Undo
      </button>

      <button
        onClick={() => setSelectedNodeId(null)}
        style={{ position: "absolute", top: 10, left: 10, zIndex: 1000 }}
      >
        Show Full Tree
      </button>

      {isForkMode && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: "red",
            color: "white",
            padding: 6,
            zIndex: 1000,
          }}
        >
          Select target node
        </div>
      )}

      <ReactFlow
        key={images?.map((i) => i?.parentId).join("-")}
        nodes={layoutedNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onNodeClick={handleNodeClick}
        defaultEdgeOptions={{
          style: { stroke: "#555", strokeWidth: 2 },
        }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {menu && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            top: menu.y,
            left: menu.x,
            background: "#ffffff",
            borderRadius: 10,
            boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
            padding: "6px 0",
            zIndex: 2000,
            minWidth: 160,
            border: "1px solid #eee",
            animation: "fadeIn 0.15s ease",
          }}
        >
          <MenuItem onClick={handleView} label="👁 View" />
          <MenuItem onClick={handleFilterBranch} label="🌿 Filter Branch" />
          <MenuItem onClick={handleFork} label="🔀 Fork" />
          <MenuItem onClick={handleCompare} label="⚖ Compare" />
        </div>
      )}

      {compareList.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(31,41,55,0.95)",
            backdropFilter: "blur(8px)",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 16,
            boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
            border: "1px solid #374151",
            zIndex: 1000,
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            {compareList.map((img) => (
              <div
                key={img.id}
                style={{
                  position: "relative",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "2px solid #4b5563",
                }}
              >
                <img
                  src={img.src}
                  style={{
                    width: 70,
                    height: 70,
                    objectFit: "cover",
                  }}
                />

                <button
                  onClick={() => removeFromCompare(img.id)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {compareList.length === 1 && (
            <span style={{ fontSize: 12, color: "#d1d5db" }}>
              Select one more image
            </span>
          )}

          {compareList.length === 2 && (
            <button
              onClick={goToCompare}
              style={{
                marginLeft: 8,
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "white",
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(59,130,246,0.4)",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              Compare →
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
  );
}
