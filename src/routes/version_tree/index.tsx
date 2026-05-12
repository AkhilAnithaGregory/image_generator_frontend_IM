import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";
import { useImageStore } from "@/lib/store/useImageStore";
import { useCompareStore } from "@/lib/store/useCompareStore";

export const Route = createFileRoute("/version_tree/")({
  component: RouteComponent,
});

const nodeWidth = 180;
const nodeHeight = 100;

const getLayoutedElements = (nodes, edges) => {
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
    const pos = graph.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    };
  });
};

const buildGraph = (images) => {
  const nodes = (images || []).map((img) => ({
    id: img.id,
    data: {
      img, // ✅ store full image object
      label: (
        <div>
          <img
            src={img.src}
            alt={img.prompt}
            style={{
              width: "130px",
              height: "60px",
              objectFit: "contain",
              borderRadius: 3,
              marginBottom: 6,
            }}
          />
          <div style={{ fontSize: 10 }}>
            {img.prompt?.slice(0, 20)}
            {img.prompt?.length > 20 && "..."}
          </div>
        </div>
      ),
    },
    position: { x: 0, y: 0 },
  }));

  const edges = images
    .filter((img) => img.parentId)
    .map((img) => ({
      id: `e-${img.parentId}-${img.id}`,
      source: img.parentId,
      target: img.id,
    }));

  return { nodes, edges };
};

function RouteComponent() {
  const { images } = useImageStore();
  const { compareList, addToCompare, removeFromCompare } =
    useCompareStore();
console.log("console.log(images);",images)
  const navigate = useNavigate();

  const [menu, setMenu] = useState(null); // {x, y, node}

  const { nodes, edges } = buildGraph(images);
  const layoutedNodes = getLayoutedElements(nodes, edges);

  const handleNodeClick = (event, node) => {
    setMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  };

  const handleCompare = () => {
    const img = menu.node.data.img;
    addToCompare(img);
    setMenu(null);
  };

  const handleView = () => {
    const img = menu.node.data.img;
    console.log("View:", img);
    setMenu(null);
  };

  const goToCompare = () => {
    navigate({ to: "/version_tree/compare" });
  };

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      <ReactFlow
        nodes={layoutedNodes}
        edges={edges}
        fitView
        onNodeClick={handleNodeClick}
      >
        <Background />
        <Controls />
      </ReactFlow>

      {/* 🔽 Dropdown */}
      {menu && (
        <div
          style={{
            position: "fixed",
            top: menu.y,
            left: menu.x,
            background: "white",
            border: "1px solid #ccc",
            padding: 8,
            zIndex: 1000,
            cursor: "pointer",
          }}
        >
          <div onClick={handleView}>View</div>
          <div onClick={handleCompare}>Compare</div>
        </div>
      )}

      {/* 🔽 Bottom Compare Bar */}
      {compareList.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            width: "100%",
            background: "#222",
            color: "white",
            padding: 10,
          }}
        >
          {compareList.length === 1 && (
            <p>Select one more image to compare</p>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            {compareList.map((img) => (
              <div key={img.id}>
                <img src={img.src} width={60} />
                <button onClick={() => removeFromCompare(img.id)}>
                  remove
                </button>
              </div>
            ))}
          </div>

          {compareList.length === 2 && (
            <button onClick={goToCompare}>Compare</button>
          )}
        </div>
      )}
    </div>
  );
}