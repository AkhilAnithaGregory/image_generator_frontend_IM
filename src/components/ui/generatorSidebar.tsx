import { useEffect, useState } from "react";
import { Button } from "./button";
import { FaCodeFork } from "react-icons/fa6";
import { IoCloudUploadOutline } from "react-icons/io5";
import { GrRevert } from "react-icons/gr";

import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";

export const GeneratorSideBar = ({
  onRevert,
  getDrawingFile,
  setLines,
  isGenerating,
  setIsGenerating,
}) => {
  /* ✅ PROJECT STORE */

  const {
    projects,
    currentProjectId,
    createProject,
    addImageToProject,
    deleteProject,
    setCurrentProject,
    renameProject,
  } = useProjectStore();

  /* ✅ IMAGE STORE (UI ONLY) */
  const { selectedNodeId, setLastGeneratedImage } = useImageStore();

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const projectImages = currentProject?.images || [];

  /* ✅ DERIVE PREVIOUS IMAGE (CRITICAL FIX) */
  const selectedImage = projectImages.find((img) => img?.id === selectedNodeId);

  const previousImageSrc =
    selectedImage?.src || projectImages[projectImages.length - 1]?.src || null;

  /* ✅ LOCAL STATE */
  const [images, setImages] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");

  const [modelName, setModelName] = useState("gemini-3.1-flash-image-preview");

  const [style, setStyle] = useState(
    "DSLR, 85mm lens, shallow depth of field, soft natural lighting",
  );

  const [aspectRatio, setAspectRatio] = useState("1:1");

  /* ✅ IMAGE UPLOAD */
  const handleImageChange = (event: any) => {
    const files = Array.from(event.target.files);

    const validImages = files.filter((file: any) =>
      file.type.startsWith("image/"),
    );

    const previews = validImages.map((file: any) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(previews);
  };

  /* ✅ GENERATE */
  const handleSubmit = async () => {
    if (!prompt.trim() && images.length === 0) {
      alert("Enter prompt or upload image");
      return;
    }

    const formData = new FormData();

    /* ✅ uploaded images */
    images.forEach((img) => {
      formData.append("images", img.file);
    });

    /* ✅ ✅ IMPORTANT FIX — USE DERIVED IMAGE */
    if (previousImageSrc) {
      const blob = await fetch(previousImageSrc).then((r) => r.blob());

      formData.append("previousImage", blob, "previous-image.png");
    }

    /* ✅ drawing */
    const drawingFile = await getDrawingFile?.();
    if (drawingFile) {
      formData.append("drawing", drawingFile);
    }

    /* ✅ params */
    formData.append("prompt", prompt);
    formData.append("aspectRatio", aspectRatio);
    formData.append("modelName", modelName);
    formData.append("style", style);

    try {
      setIsGenerating(true);

      const response = await fetch("http://localhost:3001/generate/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      const imageObj = {
        id: `node-${Date.now()}`,
        src: data.image,
        prompt,
        parentId:
          selectedNodeId || projectImages[projectImages.length - 1]?.id || null,
        previousImage: previousImageSrc,
        uploadedImages: data.uploadedImages || [],
        drawingImage: data.drawingImage || null,
        modelName: data.modelName,
        aspectRatio: data.aspectRatio,
        generatedAt: Date.now(),
      };

      /* ✅ PROJECT STORE UPDATE */
      if (!currentProjectId) {
        createProject(prompt, imageObj);
      } else {
        addImageToProject(imageObj);

        // ✅ rename ONLY if project still has default name
        const project = projects.find((p) => p.id === currentProjectId);

        if (project && project.name === "New Project") {
          const generateNameFromPrompt = (text) => {
            if (!text || !text.trim()) return "New Project";

            return (
              text
                .toLowerCase()
                .replace(/[^a-z\s]/g, "")
                .split(" ")
                .filter(
                  (word) =>
                    word.length > 2 &&
                    ![
                      "the",
                      "and",
                      "with",
                      "for",
                      "from",
                      "this",
                      "that",
                    ].includes(word),
                )
                .slice(0, 3)
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ") || "New Project"
            );
          };

          const newName = generateNameFromPrompt(prompt);

          renameProject(currentProjectId, newName);
        }
      }

      /* ✅ update UI state */
      setLastGeneratedImage(data.image);

      setPrompt("");
      setImages([]);
    } catch (err) {
      console.error(err);
      alert("Generation failed");
    } finally {
      setIsGenerating(false);
      setLines([]);
    }
  };

  useEffect(() => {
    if (!currentProjectId) return;

    const project = projects.find((p) => p.id === currentProjectId);

    if (!project?.images?.length) return;

    const last = project.images[project.images.length - 1];

    setLastGeneratedImage(last?.src);
  }, [currentProjectId]);

  return (
    <div className="h-screen min-w-75 w-75 flex flex-col justify-between bg-black text-white border-x border-gray-700 p-4 space-y-3">
      {/* INPUT */}
      <div>
        <h3 className="text-xl mb-2">AI Image</h3>

        <select
          value={currentProjectId || ""}
          onChange={(e) => setCurrentProject(e.target.value)}
          className="mb-3 w-full p-2 bg-gray-800"
        >
          <option value="">Select Project</option>

          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="border rounded-md p-2 w-full bg-gray-900"
        />

        {/* MODEL */}
        <select
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="mt-3 w-full p-2 bg-gray-800"
        >
          <option value="gemini-3.1-flash-image-preview">Gemini Flash</option>
        </select>

        {/* STYLE */}
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="mt-3 w-full p-2 bg-gray-800"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>

        {/* ASPECT */}
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="mt-3 w-full p-2 bg-gray-800"
        >
          <option value="1:1">1:1</option>
          <option value="16:9">16:9</option>
        </select>
      </div>

      {/* FOOTER */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {images.map((img, i) => (
            <img key={i} src={img.preview} className="w-16" />
          ))}
        </div>

        <div className="relative">
          <Button>
            <IoCloudUploadOutline /> Upload
          </Button>
          <input
            type="file"
            multiple
            className="absolute inset-0 opacity-0"
            onChange={handleImageChange}
          />
        </div>

        <Button onClick={handleSubmit} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate"}
        </Button>

        <div className="grid grid-cols-2 gap-2">
          <Button>
            <FaCodeFork /> Fork
          </Button>

          <Button onClick={onRevert}>
            <GrRevert /> Revert
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* ✅ NEW PROJECT */}
          <Button
            onClick={() => {
              createProject("New Project", null); // ✅ keep simple
            }}
          >
            ➕ New
          </Button>

          {/* ✅ DELETE PROJECT */}
          <Button
            onClick={() => {
              if (!currentProjectId) return;

              const remaining = projects.filter(
                (p) => p.id !== currentProjectId,
              );

              deleteProject(currentProjectId);

              if (remaining.length > 0) {
                setCurrentProject(remaining[0].id); // ✅ switch to another project
              } else {
                setCurrentProject(null); // ✅ fallback (empty state)
              }
            }}
          >
            🗑 Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
