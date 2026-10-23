import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  IoCloudUploadOutline,
  IoCloudDownloadOutline,
  IoClose,
} from "react-icons/io5";
import { GrRevert } from "react-icons/gr";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";
import type { LineType } from "../../ui/DrawingCanvas";
import { BASE_URL } from "@/lib/defaultValues";
import { CommitDialog } from "../commitDialog";
import { useAuthStore } from "@/lib/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import * as api from "@/lib/api";
import { RiImageCircleAiFill } from "react-icons/ri";
import { LuPencil, LuImagePlus, LuPlus, LuTrash2 } from "react-icons/lu";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface GeneratorSideBarProps {
  onRevert?: () => void;
  getDrawingFile?: () => Promise<File | null> | File | null;
  lines: any;
  setLines: React.Dispatch<React.SetStateAction<LineType[]>>;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  showCommitDialog: boolean;
  setShowCommitDialog: (v: boolean) => void;
}

export const GeneratorSideBar: React.FC<GeneratorSideBarProps> = ({
  getDrawingFile,
  lines,
  setLines,
  isGenerating,
  setIsGenerating,
  showCommitDialog,
  setShowCommitDialog,
}) => {
  const navigate = useNavigate();
  const {
    projects,
    currentProjectId,
    createProject,
    backendProjectId,
    addImageToProject,
    replaceImageInProject,
    removeImageFromProject,
    setCurrentProject,
    renameProject,
    setHasUnsavedChanges,
    hasUnsavedChanges,
    resetLiveContext,
    currentBranchId,
    lastKnownVersion,
    setLastKnownVersion,
  } = useProjectStore();

  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;

  // Confirmation dialog states
  const [showNewConfirm, setShowNewConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    selectedNodeId,
    setSelectedNodeId,
    setLastGeneratedImage,
    editingImageId,
    clearEditing,
    resetImageSelection,
  } = useImageStore();

  const { data: backendProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    enabled: isLoggedIn,
    staleTime: 5000,
  });

  // Query to check if remote branch has newer version (for smart pull button)
  const { data: remoteBranchData } = useQuery({
    queryKey: ["remote-branch-version", currentBranchId],
    queryFn: () => api.pullLatest(currentBranchId!),
    enabled: isLoggedIn && !!currentBranchId,
    refetchInterval: 15000, // poll every 15s
    staleTime: 10000,
  });

  const remoteVersion = remoteBranchData?.version;
  const hasRemoteChanges =
    remoteVersion != null &&
    lastKnownVersion != null &&
    remoteVersion > lastKnownVersion;

  const currentProject = projects.find((p) => p.id === currentProjectId);

  const projectsToShow = isLoggedIn ? backendProjects : projects;
  const normalizedProjects = useMemo(() => {
    const list = projectsToShow.map((p: any) => ({
      id: p._id || p.id,
      name: p.name,
    }));
    // If backendProjectId is set (e.g. freshly pushed) but not yet returned in backendProjects,
    // inject it immediately so the dropdown selects and displays it without needing a manual refresh
    if (
      isLoggedIn &&
      backendProjectId &&
      !list.some((p: any) => p.id === backendProjectId)
    ) {
      list.unshift({
        id: backendProjectId,
        name: currentProject?.name || "Current Project",
      });
    }
    return list;
  }, [projectsToShow, isLoggedIn, backendProjectId, currentProject?.name]);
  const projectImages = currentProject?.images || [];
  const selectedImage = projectImages.find((img) => img?.id === selectedNodeId);

  const previousImageSrc =
    selectedImage?.src || projectImages[projectImages.length - 1]?.src || null;

  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [prompt, setPrompt] = useState("");
  const [modelName, setModelName] = useState("gemini-3.1-flash-image-preview");
  const [style, setStyle] = useState(
    "DSLR, 85mm lens, shallow depth of field, soft natural lighting, sharp focus on subject",
  );
  const [aspectRatio, setAspectRatio] = useState("1:1");

  // When entering edit mode, pre-fill the prompt from the editing image
  const editingImage = editingImageId
    ? projectImages.find((img) => img.id === editingImageId)
    : null;

  useEffect(() => {
    if (editingImage) {
      setPrompt(editingImage.prompt || "");
      if ((editingImage as any).modelName) {
        setModelName((editingImage as any).modelName);
      }
      if ((editingImage as any).aspectRatio) {
        setAspectRatio((editingImage as any).aspectRatio);
      }
    }
  }, [editingImageId]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList) return;

    const files = Array.from(fileList) as File[];
    const validImages = files.filter((file) => file.type.startsWith("image/"));
    const newPreviews = validImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newPreviews].slice(0, 4));
    event.target.value = "";
  };

  const removeReferenceImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleStartNewProject = () => {
    resetLiveContext();
    setCurrentProject(null);
    resetImageSelection();
    setLastGeneratedImage(null);
    clearEditing();
    setLines([]);
    setPrompt("");
    images.forEach((img) => {
      if (img.preview) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    navigate({ to: "/" });
  };

  const handleRevert = () => {
    if (!currentProjectId || !projectImages.length) {
      alert("No image to revert");
      return;
    }

    const currentImg = selectedNodeId
      ? projectImages.find((img) => img.id === selectedNodeId)
      : projectImages[projectImages.length - 1];

    if (!currentImg) {
      alert("Select an image to revert");
      return;
    }

    // Find the previous version on the branch
    const parentImg = currentImg.parentId
      ? projectImages.find((img) => img.id === currentImg.parentId)
      : null;

    const targetIndex = projectImages.findIndex(
      (img) => img.id === currentImg.id,
    );
    const fallbackPrevImg =
      targetIndex > 0 ? projectImages[targetIndex - 1] : null;
    const previousVersion = parentImg || fallbackPrevImg;

    // Delete the currently selected image from project
    removeImageFromProject(currentImg.id);
    setHasUnsavedChanges(true);
    clearEditing();

    if (previousVersion) {
      setSelectedNodeId(previousVersion.id);
      if (previousVersion.src) {
        setLastGeneratedImage(previousVersion.src);
      }
    } else {
      // No more images in project - go back to fresh state
      resetImageSelection();
      setLastGeneratedImage(null);
      setCurrentProject(null);
      navigate({ to: "/" });
    }
  };

  const [isPulling, setIsPulling] = useState(false);

  const handlePullLatest = async () => {
    if (!currentBranchId) {
      alert("No active branch selected to pull");
      return;
    }

    try {
      setIsPulling(true);
      const data = await api.pullLatest(currentBranchId);
      const projectStore = useProjectStore.getState();
      const imageStore = useImageStore.getState();

      projectStore.updateProjectImages(data.state?.images || []);
      projectStore.setLastKnownVersion(data.version);
      projectStore.setHasUnsavedChanges(false);

      const latestImg = (data.state?.images || []).at(-1);
      if (latestImg) {
        imageStore.setLastGeneratedImage(latestImg.src);
        imageStore.setSelectedNodeId(latestImg.id);
      } else {
        imageStore.resetImageSelection();
      }
      imageStore.clearEditing();
      toast.success("Pulled Successfully");
    } catch (err: any) {
      console.error("Pull failed:", err);
      toast.error(err.message || "Failed to pull latest changes from branch");
    } finally {
      setIsPulling(false);
    }
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
    // If drawing with mask, attach previous image as base.
    // If not drawing and user uploaded reference images, do NOT attach previousImage so uploaded images serve as reference.
    const drawingFile = await getDrawingFile?.();
    if (drawingFile) {
      formData.append("drawing", drawingFile);
    }

    formData.append("prompt", prompt);
    formData.append("modelName", modelName);
    formData.append("aspectRatio", aspectRatio);
    formData.append("style", style);
    // Always send previousImage when a canvas image exists — the backend uses it for
    // inpainting (with drawing), compositing reference subjects into the scene, or
    // generating variations. Without it, reference images are treated as standalone.
    if (previousImageSrc) {
      const blob = await fetch(previousImageSrc).then((r) => r.blob());
      formData.append("previousImage", blob, "previous-image.png");
    }

    try {
      setIsGenerating(true);

      const response = await fetch(BASE_URL + "/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Guard: never set parentId to the image's own ID
      const effectiveParentId = editingImageId
        ? editingImage?.parentId || null
        : selectedNodeId || projectImages[projectImages.length - 1]?.id || null;

      const newId = editingImageId || `node-${Date.now()}`;

      const imageObj = {
        id: newId,
        src: data.image,
        prompt,
        parentId: effectiveParentId !== newId ? effectiveParentId : null,
        previousImage: previousImageSrc,
        uploadedImages: data.uploadedImages || [],
        drawingImage: data.drawingImage || null,
        modelName: data.modelName,
        aspectRatio: data.aspectRatio,
        generatedAt: Date.now(),
      };

      // If in edit mode, replace the image in-place
      if (editingImageId) {
        replaceImageInProject(editingImageId, imageObj);
        clearEditing();
      } else if (!currentProjectId) {
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
  }, [currentProjectId, projects, setLastGeneratedImage]);

  const handleProjectSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    if (isLoggedIn) {
      const selected = backendProjects.find((p: any) => p._id === selectedId);
      if (!selected) return;

      const draftProjectId = `backend-${selected._id}`;
      const exists = projects.some((p) => p.id === draftProjectId);

      if (!exists) {
        useProjectStore
          .getState()
          .createDraftProjectWithId(draftProjectId, selected.name, []);
      } else {
        setCurrentProject(draftProjectId);
      }

      api.pullLatest(selected.liveBranch).then((data) => {
        useProjectStore.getState().updateProjectImages(data.state.images);
        useProjectStore
          .getState()
          .setBackendProject(selected._id, selected.liveBranch, data.version);
      });
    } else {
      setCurrentProject(selectedId);
    }
  };

  const isEditMode = !!editingImageId;

  return (
    <div
      className="flex flex-col h-full border-r border-white/[0.06] select-none text-gray-200 w-full lg:w-[340px] shrink-0"
      style={{
        background: "#080b12",
        fontFamily: "'Geist', system-ui, sans-serif",
      }}
    >
      {/* Top Header / Project Selector */}
      <div className="px-5 pt-5 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
            Project
          </span>
          {isLoggedIn && backendProjectId && (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Live Synced
            </span>
          )}
        </div>

        <select
          id="project-select"
          value={isLoggedIn ? backendProjectId || "" : currentProjectId || ""}
          onChange={handleProjectSelect}
          className="w-full p-2.5 bg-white/4 border border-white/[0.08] rounded-xl text-white text-sm outline-none focus:border-white/[0.15] transition-colors cursor-pointer"
        >
          <option value="" className="bg-[#0f1219]">
            Select Project
          </option>
          {normalizedProjects.map((p: any) => (
            <option key={p.id} value={p.id} className="bg-[#0f1219]">
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Edit Mode Notification Banner */}
      {isEditMode && (
        <div className="mx-4 mt-3 px-3.5 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-medium text-amber-300">
              Editing History Image
            </span>
          </div>
          <button
            onClick={clearEditing}
            className="text-[11px] text-amber-400/80 hover:text-amber-300 transition-colors cursor-pointer font-medium"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Prompt Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
              Prompt
            </label>
            <span className="text-[10px] text-gray-600 font-mono">
              {prompt.length} chars
            </span>
          </div>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="A cinematic cybernetic samurai in neo-tokyo..."
            rows={4}
            className="w-full p-3 bg-white/4 border border-white/8 rounded-xl text-white text-sm placeholder:text-gray-600 outline-none focus:border-white/[0.15] resize-none transition-colors leading-relaxed"
          />
        </div>

        {/* AI Model Selector */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 mb-1.5 block">
            AI Model
          </span>
          <select
            id="model"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            className="w-full p-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-sm outline-none focus:border-white/15 transition-colors"
          >
            <option
              value="gemini-3.1-flash-image-preview"
              className="bg-[#0f1219]"
            >
              Gemini 3.1 Flash (Fast & Sharp)
            </option>
            <option value="gemini-2.5-flash-image" className="bg-[#0f1219]">
              Gemini 2.5 Flash
            </option>
          </select>
        </div>

        {/* Preset Styles */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 mb-2 block">
            Style Preset
          </span>
          <select
            id="style-preset"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full p-2.5 bg-white/4 border border-white/8 rounded-xl text-white text-sm outline-none focus:border-white/15 transition-colors cursor-pointer"
          >
            <option
              value="DSLR, 85mm lens, shallow depth of field, soft natural lighting, sharp focus on subject"
              className="bg-[#0f1219]"
            >
              Photorealistic
            </option>
            <option
              value="futuristic cyberpunk city, neon glow, wet reflections, high contrast, atmospheric fog"
              className="bg-[#0f1219]"
            >
              Cyberpunk
            </option>
            <option
              value="modern anime illustration, Makoto Shinkai style, vibrant colors, detailed sky, cinematic lighting"
              className="bg-[#0f1219]"
            >
              Anime Art
            </option>
            <option
              value="classic oil painting, textured brush strokes, moody lighting, renaissance aesthetic"
              className="bg-[#0f1219]"
            >
              Oil Painting
            </option>
            <option
              value="3D digital art, octane render, unreal engine 5, ray tracing, studio lighting"
              className="bg-[#0f1219]"
            >
              3D Digital / Octane
            </option>
            <option
              value="epic fantasy concept art, matte painting, highly detailed, dramatic lighting"
              className="bg-[#0f1219]"
            >
              Fantasy Concept Art
            </option>
            <option
              value="clean minimalist vector art, flat design, bold shapes, elegant palette"
              className="bg-[#0f1219]"
            >
              Minimalist Vector
            </option>
            <option value="" className="bg-[#0f1219]">
              None / Default
            </option>
          </select>
        </div>

        {/* Aspect Ratio */}
        <div>
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 mb-1.5 block">
            Aspect Ratio
          </span>
          <select
            id="aspect"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full p-2.5 bg-white/4 border border-white/[0.08] rounded-xl text-white text-sm outline-none focus:border-white/[0.15] transition-colors"
          >
            <option value="1:1" className="bg-[#0f1219]">
              1:1 Square
            </option>
            <option value="3:4" className="bg-[#0f1219]">
              3:4 Portrait
            </option>
            <option value="16:9" className="bg-[#0f1219]">
              16:9 Widescreen
            </option>
          </select>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-5 pb-5 pt-3 space-y-3 border-t border-white/[0.06]">
        {/* Uploaded image reference previews with delete button */}
        {images.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                References ({images.length}/4)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative group w-12 h-12 rounded-lg overflow-hidden border border-white/[0.1] bg-black shadow-sm"
                >
                  <img
                    src={img.preview}
                    alt={`Reference ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeReferenceImage(i)}
                    className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center transition-colors shadow-sm cursor-pointer"
                    title="Remove reference"
                  >
                    <IoClose size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload reference button */}
        <div className="relative">
          <Button className="w-full bg-white/4 border border-white/[0.08] hover:bg-white/[0.06] text-gray-300 transition-colors rounded-xl py-2.5">
            <LuImagePlus size={16} />
            <span className="ml-2">Upload Reference ({images.length}/4)</span>
          </Button>
          <input
            type="file"
            multiple
            accept="image/*"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleImageChange}
          />
        </div>

        {/* Main Generate / Update Button */}
        <Button
          onClick={handleSubmit}
          disabled={isGenerating}
          className={`w-full py-3 rounded-xl transition-all font-medium text-sm flex items-center justify-center shadow-lg cursor-pointer ${
            isEditMode
              ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20"
              : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
          }`}
        >
          {isGenerating ? (
            <>
              <Spinner />
              <span className="ml-2">
                {isEditMode ? "Updating..." : "Creating..."}
              </span>
            </>
          ) : (
            <>
              {isEditMode ? (
                <LuPencil size={16} />
              ) : (
                <RiImageCircleAiFill size={16} />
              )}
              <span className="ml-2">
                {isEditMode ? "Update Image" : "Generate"}
              </span>
            </>
          )}
        </Button>

        {/* Action Controls Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* New Project Button */}
          <Button
            type="button"
            onClick={() => setShowNewConfirm(true)}
            className="bg-white/4 border border-white/[0.08] hover:bg-white/[0.08] text-gray-300 text-xs rounded-xl py-2.5 transition-colors flex items-center justify-center"
            title="Start new project"
          >
            <LuPlus size={14} />
            <span className="ml-1">New</span>
          </Button>

          {/* Revert Button - Deletes currently selected image and returns to previous branch version */}
          <Button
            type="button"
            onClick={handleRevert}
            className="bg-white/4 border border-white/[0.08] hover:bg-amber-500/10 hover:border-amber-500/20 hover:text-amber-400 text-gray-300 text-xs rounded-xl py-2.5 transition-colors flex items-center justify-center"
            title="Revert to previous version"
          >
            <GrRevert size={13} />
            <span className="ml-1">Revert</span>
          </Button>

          {/* Delete Button */}
          <Button
            type="button"
            onClick={() => {
              if (!selectedNodeId) {
                toast.error("Select an image to delete");
                return;
              }
              if (!currentProjectId) return;
              setShowDeleteConfirm(true);
            }}
            className="bg-white/4 border border-white/[0.08] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-gray-300 text-xs rounded-xl py-2.5 transition-colors flex items-center justify-center"
            title="Delete selected image"
          >
            <LuTrash2 size={14} />
            <span className="ml-1">Delete</span>
          </Button>
        </div>

        {/* Git Actions for logged-in users */}
        {isLoggedIn && (
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={handlePullLatest}
              disabled={isPulling || !currentBranchId || !hasRemoteChanges}
              className="bg-white/4 border border-white/[0.08] hover:bg-blue-500/10 hover:border-blue-500/20 hover:text-blue-400 text-gray-300 text-xs rounded-xl py-2.5 transition-colors flex items-center justify-center disabled:opacity-40"
              title={
                hasRemoteChanges
                  ? "Pull latest version of the selected branch"
                  : "No remote changes to pull"
              }
            >
              <IoCloudDownloadOutline
                size={14}
                className={isPulling ? "animate-spin" : ""}
              />
              <span className="ml-1.5">
                {isPulling ? "Pulling..." : "Pull Latest"}
              </span>
            </Button>

            <Button
              type="button"
              onClick={() => setShowCommitDialog(true)}
              disabled={!hasUnsavedChanges && !!backendProjectId}
              className="bg-white/4 border border-white/[0.08] hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400 text-gray-300 text-xs rounded-xl py-2.5 transition-colors flex items-center justify-center disabled:opacity-40"
              title={
                hasUnsavedChanges || !backendProjectId
                  ? "Push changes to cloud branch"
                  : "No local changes to push"
              }
            >
              <IoCloudUploadOutline size={14} />
              <span className="ml-1.5">Push Changes</span>
            </Button>
          </div>
        )}
      </div>

      <CommitDialog
        open={showCommitDialog}
        onClose={() => setShowCommitDialog(false)}
        projectName={currentProject?.name || "New Project"}
        state={{
          images: currentProject?.images ?? [],
        }}
      />

      {/* New Project Confirmation Dialog */}
      <AlertDialog open={showNewConfirm} onOpenChange={setShowNewConfirm}>
        <AlertDialogContent className="bg-[#0f131d] border border-white/[0.08] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Start New Project?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will clear the current workspace and start a fresh project.
              Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/4 border-white/[0.08] text-gray-300 hover:bg-white/[0.08] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-500 text-white border-0"
              onClick={() => {
                setShowNewConfirm(false);
                handleStartNewProject();
              }}
            >
              Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Image Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-[#0f131d] border border-white/[0.08] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Image?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This will permanently remove the selected image from your project.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/4 border-white/[0.08] text-gray-300 hover:bg-white/[0.08] hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-500 text-white border-0"
              onClick={() => {
                setShowDeleteConfirm(false);
                if (selectedNodeId && currentProjectId) {
                  removeImageFromProject(selectedNodeId);
                  setHasUnsavedChanges(true);
                  resetImageSelection();
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
