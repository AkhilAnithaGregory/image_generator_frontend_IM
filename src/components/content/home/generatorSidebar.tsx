import React, { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { FaCodeFork } from "react-icons/fa6";
import { IoCloudUploadOutline } from "react-icons/io5";
import { GrRevert } from "react-icons/gr";

import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";
import type { LineType } from "../../ui/DrawingCanvas";
import { BASE_URL } from "@/lib/defaultValues";
import { CommitDialog } from "../commitDiaog";
import { IoGitPullRequestSharp } from "react-icons/io5";
import { PiGitBranchBold } from "react-icons/pi";
import { useAuthStore } from "@/lib/store/authStore";
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

interface GeneratorSideBarProps {
  onRevert: () => void;
  getDrawingFile?: () => Promise<File | null> | File | null;
  lines: any;
  setLines: React.Dispatch<React.SetStateAction<LineType[]>>;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

export const GeneratorSideBar: React.FC<GeneratorSideBarProps> = ({
  onRevert,
  getDrawingFile,
  lines,
  setLines,
  isGenerating,
  setIsGenerating,
  showCommitDialog,
  setShowCommitDialog,
}) => {
  const {
    projects,
    currentProjectId,
    createProject,
    addImageToProject,
    deleteProject,
    setCurrentProject,
    renameProject,
  } = useProjectStore();

  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;

  const [projectId, setProjectId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [lastKnownVersion, setLastKnownVersion] = useState(1);
  const { selectedNodeId, setLastGeneratedImage } = useImageStore();

  const { data: backendProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    enabled: isLoggedIn, // ✅ ONLY when logged in
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const projectsToShow = isLoggedIn ? backendProjects : projects;
  const normalizedProjects = projectsToShow.map((p: any) => ({
    id: p._id || p.id,
    name: p.name,
  }));

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const projectImages = currentProject?.images || [];

  const selectedImage = projectImages.find((img) => img?.id === selectedNodeId);

  const previousImageSrc =
    selectedImage?.src || projectImages[projectImages.length - 1]?.src || null;

  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [prompt, setPrompt] = useState("");

  const [modelName, setModelName] = useState("gemini-3.1-flash-image-preview");

  const [style, setStyle] = useState(
    "DSLR, 85mm lens, shallow depth of field, soft natural lighting",
  );

  const [aspectRatio, setAspectRatio] = useState("1:1");

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const files = Array.from(fileList) as File[];

    const validImages = files.filter((file) => file.type.startsWith("image/"));

    const previews = validImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages(previews.slice(0, 4));
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

    if (previousImageSrc) {
      const blob = await fetch(previousImageSrc).then((r) => r.blob());

      formData.append("previousImage", blob, "previous-image.png");
    }

    const drawingFile = await getDrawingFile?.();
    if (drawingFile) {
      formData.append("drawing", drawingFile);
    }

    formData.append("prompt", prompt);
    formData.append("aspectRatio", aspectRatio);
    formData.append("modelName", modelName);
    formData.append("style", style);

    try {
      setIsGenerating(true);

      const response = await fetch(BASE_URL + "/generate", {
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

      if (!currentProjectId) {
        createProject(prompt, imageObj);
      } else {
        addImageToProject(imageObj);

        const project = projects.find((p) => p.id === currentProjectId);

        if (project && project.name === "New Project") {
          const generateNameFromPrompt = (text: string) => {
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
      <div>
        <h3 className="text-xl mb-2">AI Image</h3>

        <select
          value={currentProjectId || ""}
          onChange={async (e) => {
            const nextProjectId = e.target.value;

            // 1️⃣ Switch draft project
            setCurrentProject(nextProjectId);

            // 2️⃣ Reset live + image context
            useProjectStore.getState().resetLiveContext();
            useImageStore.getState().resetImageSelection();

            // 3️⃣ IF backend project → hydrate it
            if (isLoggedIn && nextProjectId) {
              const project = backendProjects.find(
                (p: any) => p._id === nextProjectId,
              );

              if (!project) return;

              const branchId = project.liveBranch;

              // ✅ pull backend state
              const data = await api.pullLatest(branchId);

              // ✅ hydrate draft images
              useProjectStore.getState().updateProjectImages(data.state.images);

              // ✅ set live context
              useProjectStore
                .getState()
                .setBackendProject(project._id, branchId, data.version);

              // ✅ select last image
              const last = data.state.images.at(-1);
              if (last?.id) {
                useImageStore.getState().setSelectedNodeId(last.id);
                useImageStore.getState().setLastGeneratedImage(last.src);
              }
            }
          }}
          className="mb-3 w-full p-2 bg-gray-800"
        >
          <option value="">Select Project</option>

          {normalizedProjects.map((p) => (
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

        <select
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          className="mt-3 w-full p-2 bg-gray-800"
        >
          <option value="gemini-3.1-flash-image-preview">Gemini Flash</option>
        </select>

        <select
          value={style}
          onChange={(e) => setStyle(e.target.value)}
          className="mt-3 w-full p-2 bg-gray-800"
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>

        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="mt-3 w-full p-2 bg-gray-800"
        >
          <option value="1:1">1:1</option>
          <option value="16:9">16:9</option>
        </select>
      </div>

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
          <Button
            onClick={() => {
              createProject("New Project", null); // ✅ keep simple
            }}
          >
            ➕ New
          </Button>

          <Button
            onClick={() => {
              if (!currentProjectId) return;

              const remaining = projects.filter(
                (p) => p.id !== currentProjectId,
              );

              deleteProject(currentProjectId);

              if (remaining.length > 0) {
                setCurrentProject(remaining[0].id);
              } else {
                setCurrentProject(null);
              }
            }}
          >
            🗑 Delete
          </Button>
        </div>

        <Button
          onClick={() => {
            setShowCommitDialog(true);
          }}
        >
          <IoCloudUploadOutline /> Push
        </Button>
      </div>

      <CommitDialog
        open={showCommitDialog}
        onClose={() => setShowCommitDialog(false)}
        projectId={projectId}
        branchId={branchId}
        projectName={currentProject?.name || "New Project"}
        state={{
          images: currentProject?.images ?? [],
          lines,
        }}
        lastKnownVersion={lastKnownVersion}
        onSuccess={({ projectId, branchId }) => {
          setProjectId(projectId);
          setBranchId(branchId);
        }}
      />
    </div>
  );
};
