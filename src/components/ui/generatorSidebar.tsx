import { useState } from "react";
import { useImageStore } from "@/lib/store/useImageStore";
import { Button } from "./button";
import { FaCodeFork } from "react-icons/fa6";
import { IoCloudUploadOutline } from "react-icons/io5";
import { GrRevert } from "react-icons/gr";

export const GeneratorSideBar = ({
  lastGeneratedImage,
  setLastGeneratedImage,
  onRevert,
}) => {
  const { nodes, edges, setGraph, addImage, selectedNodeId } = useImageStore();
  const [images, setImages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files);

    const validImages = files.filter((file) => file.type.startsWith("image/"));

    if (validImages.length !== files.length) {
      alert("Some files were not images and have been ignored.");
    }

    const imagePreviews = validImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(imagePreviews);
  };

  const handleSubmit = async () => {
    if (!prompt.trim() && images.length === 0) {
      alert("Enter prompt or upload image");
      return;
    }

    const formData = new FormData();

    images.forEach((img) => {
      formData.append("images", img.file);
    });

    formData.append("prompt", prompt);

    if (lastGeneratedImage) {
      const blob = await fetch(lastGeneratedImage).then((r) => r.blob());
      formData.append("previousImage", blob, "previous-image.png");
    }

    try {
      setLoading(true);

      const response = await fetch("https://image-generator-backend-im.onrender.com/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const imageSrc = data.image;

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

      const parentId = selectedNodeId || nodes[nodes.length - 1]?.id;

      let newEdge = null;

      if (parentId) {
        newEdge = {
          id: `e-${parentId}-${newNodeId}`,
          source: parentId,
          target: newNodeId,
        };
      }

      const updatedNodes = [...nodes, newNode];
      const updatedEdges = newEdge ? [...edges, newEdge] : edges;

      setGraph(updatedNodes, updatedEdges);

      addImage({
        id: newNodeId,
        src: imageSrc,
        prompt,
        parentId,
      });

      setLastGeneratedImage(imageSrc);
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
    <div className="h-screen min-w-75 w-75 flex flex-col justify-between text-white bg-black border-x border-gray-700 p-4 text-start space-y-3">
      <div>
        <div className="space-y-3">
          <h3 className="text-xl">Version History</h3>
          <textarea
            rows={3}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSubmit();
              }
            }}
            className="border focus:outline-none ring-0 rounded-md p-2 w-full"
          />
        </div>
        <div className="space-y-3">
          <h4 className="text-md">AI Model</h4>
          <select className="border focus:outline-none ring-0 rounded-md p-2 w-full">
            <option value="gemini-3.1-flash-image-preview">
              Gemini 3.1 Flash Image Preview
            </option>
            <option value="gemini-3-pro-image-preview">
              Gemini 3 Pro Image Preview
            </option>
            <option value="gemini-2.5-flash-image">
              Gemini 2.5 Flash Image
            </option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
          </select>
        </div>
        <div className="space-y-3">
          <h4 className="text-md">Setup</h4>
          <select className="border focus:outline-none ring-0 rounded-md p-2 w-full">
            <option value="DSLR, 85mm lens, shallow depth of field, soft natural lighting, sharp focus on subject">
              Portrait
            </option>
            <option value="wide angle lens, 16mm, deep depth of field, natural lighting, highly detailed">
              Landscape
            </option>
            <option value="cinematic lighting, anamorphic lens, film still, dramatic shadows, depth of field">
              Cinematic
            </option>
            <option value="macro lens, studio lighting, ultra sharp, clean background, high detail">
              Product / Close-up
            </option>
          </select>
        </div>
        <div className="space-y-3">
          <h4 className="text-md">Aspect Ratio</h4>
          <select className="border focus:outline-none ring-0 rounded-md p-2 w-full">
            <option value="volvo">16:9</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-x-4 overflow-x-auto max-w-full">
          {images.map((img: { preview: string }, index) => (
            <div key={index} className="text-center shrink-0">
              <img
                src={img.preview}
                alt={`preview-${index}`}
                className="w-25 h-25 object-cover rounded-lg border border-gray-300"
              />
            </div>
          ))}
        </div>
        <div className="w-full relative">
          <Button variant="imgButton">
            <IoCloudUploadOutline />
            Upload file
          </Button>
          <input
            className="opacity-0 absolute top-0 left-0 right-0 bottom-0"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
        </div>
        <Button variant="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </Button>
        <div className="grid grid-cols-2 items-center gap-x-3 w-full">
          <Button variant="imgButton">
            <FaCodeFork />
            Fork
          </Button>
          <Button variant="imgButton" onClick={onRevert}>
            <GrRevert />
            Revert
          </Button>
        </div>
      </div>
    </div>
  );
};
