import { useState, useCallback } from "react";
import ReactFlow, { Background, Controls, useReactFlow } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

const nodeWidth = 180;
const nodeHeight = 180;

const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "TB" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const pos = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - nodeHeight / 2,
      },
    };
  });
};

export default function App() {
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [lastGeneratedImage, setLastGeneratedImage] = useState(null);

  const handleFileChange = (e) => {
    setImages([...e.target.files]);
  };

  const onNodeClick = (event, node) => {
    setSelectedNode(node.id);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() && images.length === 0) {
      alert("Enter prompt or upload image");
      return;
    }

    const formData = new FormData();

    // Newly uploaded images
    images.forEach((img) => formData.append("images", img));

    // Prompt
    formData.append("prompt", prompt);

    // Previous generated image for chaining
    if (lastGeneratedImage) {
      const blob = await fetch(lastGeneratedImage).then((r) => r.blob());

      formData.append("previousImage", blob, "previous-image.png");
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const imageSrc = `data:${data.mimeType};base64,${data.image}`;

      // Save latest generated image for next iteration
      setLastGeneratedImage(imageSrc);

      const newNodeId = `node-${Date.now()}`;

      const newNode = {
        id: newNodeId,
        data: {
          label: (
            <div style={{ textAlign: "center" }}>
              <img
                src={imageSrc}
                width={140}
                style={{
                  borderRadius: 8,
                  objectFit: "cover",
                }}
              />
              <div style={{ fontSize: 12, marginTop: 8 }}>
                {prompt || "No prompt"}
              </div>
            </div>
          ),
        },
        position: { x: 0, y: 0 },
      };

      let newEdge = null;

      if (nodes.length > 0) {
        const parentId = selectedNode || nodes[nodes.length - 1]?.id;

        newEdge = {
          id: `e-${parentId}-${newNodeId}`,
          source: parentId,
          target: newNodeId,
        };
      }

      const updatedNodes = [...nodes, newNode];
      const updatedEdges = newEdge ? [...edges, newEdge] : edges;

      const layoutedNodes = getLayoutedElements(updatedNodes, updatedEdges);

      setNodes(layoutedNodes);
      setEdges(updatedEdges);

      // Reset inputs after generation
      setPrompt("");
      setImages([]);
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Image Generation Tree</h2>

      <input type="file" multiple onChange={handleFileChange} />
      <br />
      <br />

      <input
        type="text"
        placeholder="Enter prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        style={{ width: 300 }}
      />
      <br />
      <br />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </button>

      <div
        style={{
          height: 600,
          marginTop: 20,
          border: "1px solid #ccc",
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
