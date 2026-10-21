import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";
import { Separator } from "@/components/ui/separator";
import { getBranches, pullLatest } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { LuPencil } from "react-icons/lu";
import { FiClock } from "react-icons/fi";

export const HistorySideBar = () => {
  const {
    currentProjectId,
    projects,
    backendProjectId,
    currentBranchId,
    setCurrentBranchId,
    setLastKnownVersion,
    hasUnsavedChanges,
    setHasUnsavedChanges,
  } = useProjectStore();

  const {
    selectedNodeId,
    setSelectedNodeId,
    setLastGeneratedImage,
    editingImageId,
    setEditingImageId,
    clearEditing,
  } = useImageStore();

  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;

  const currentProject = projects.find((p) => p.id === currentProjectId);
  const images = currentProject?.images || [];
  const isLiveProject = !!backendProjectId && !!currentBranchId;

  const { data: branches = [] } = useQuery({
    queryKey: ["branches", backendProjectId],
    queryFn: () => getBranches(backendProjectId!),
    enabled: !!backendProjectId,
  });

  const [pendingBranchId, setPendingBranchId] = useState<string | null>(null);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);

  const handleBranchChange = (nextBranchId: string) => {
    if (nextBranchId === currentBranchId) return;
    if (hasUnsavedChanges) {
      setPendingBranchId(nextBranchId);
      setShowUnsavedDialog(true);
      return;
    }
    switchBranch(nextBranchId);
  };

  const switchBranch = async (branchId: string) => {
    try {
      setCurrentBranchId(branchId);
    } catch (err) {
      console.error("ERROR in setCurrentBranchId", err);
      return;
    }

    try {
      const data = await pullLatest(branchId);
      useProjectStore.getState().updateProjectImages(data.state?.images || []);

      setLastGeneratedImage(
        data.state?.images?.[data.state.images.length - 1]?.src || null,
      );
      setSelectedNodeId(null);
      clearEditing();
      setLastKnownVersion(data.version);
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error("Failed to switch branch:", err);
    }
  };

  const discardAndSwitch = async () => {
    if (pendingBranchId) {
      await switchBranch(pendingBranchId);
    }
    setShowUnsavedDialog(false);
  };

  const handleEditClick = (imageId: string) => {
    setEditingImageId(imageId);
    setSelectedNodeId(imageId);
    const img = images.find((i) => i.id === imageId);
    if (img) {
      setLastGeneratedImage(img.src);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="h-full w-full lg:w-[320px] shrink-0 flex flex-col min-h-0 border-l border-white/[0.06] p-0 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0c0f17 0%, #0a0d14 100%)" }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3 shrink-0">
        {isLiveProject && (
          <>
            <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500 mb-2 block">
              Branch
            </span>
            <select
              key={currentBranchId}
              value={currentBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm outline-none focus:border-white/[0.15] transition-colors mb-4 cursor-pointer"
            >
              {branches.map((branch) => (
                <option key={branch._id} value={branch._id} className="bg-[#0f1219]">
                  {branch.name}
                </option>
              ))}
            </select>
          </>
        )}

        <div className="flex items-center gap-2">
          <FiClock size={14} className="text-gray-500" />
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">
            Version History
          </span>
          <span className="ml-auto text-[11px] text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-full font-mono">
            {images.length}
          </span>
        </div>
      </div>

      <Separator className="bg-white/[0.06] shrink-0" />

      {/* History List with smooth overflow scrolling */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3">
        {images.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-500">
            No history yet
          </div>
        ) : (
          <ul className="space-y-2">
            {images.map((img, index) => {
              const isSelected = selectedNodeId === img.id;
              const isEditing = editingImageId === img.id;

              return (
                <li key={img.id}>
                  <div
                    onClick={() => {
                      setSelectedNodeId(img.id);
                      setLastGeneratedImage(img.src);
                    }}
                    className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? "ring-1 ring-blue-500/40 bg-white/[0.04]"
                        : "hover:bg-white/[0.03]"
                    } ${isEditing ? "ring-1 ring-amber-500/50" : ""}`}
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden rounded-t-xl bg-[#080b12]">
                      <img
                        src={img.src || ""}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        alt={img.prompt || "Generated"}
                      />

                      {/* Hover overlay with Edit button */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(img.id);
                          }}
                          className="absolute bottom-2 right-2 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-medium rounded-lg shadow-lg flex items-center gap-1 transition-all cursor-pointer"
                          title="Edit and refine this prompt"
                        >
                          <LuPencil size={11} />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* Version Badge */}
                      <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-[10px] text-gray-300 px-2 py-0.5 rounded-md font-mono">
                        v{index + 1}
                      </span>

                      {/* Active Indicator */}
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="p-3">
                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                        {img.prompt || "Untitled generation"}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.04]">
                        <span className="text-[10px] text-gray-600 font-mono">
                          {(img as any).modelName ? "Gemini Flash" : "Default"}
                        </span>
                        <span className="text-[10px] text-gray-600">
                          {formatTime((img as any).generatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Unsaved indicator without redundant pull/push buttons */}
      {hasUnsavedChanges && isLoggedIn && (
        <div className="px-5 py-3 border-t border-white/[0.06] bg-amber-500/[0.03] shrink-0">
          <p className="text-[11px] text-amber-400 flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved changes
          </p>
        </div>
      )}

      {/* Switch branch unsaved dialog */}
      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="bg-[#0f131d] border border-white/[0.08] text-white max-w-sm rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Unsaved Changes</DialogTitle>
          </DialogHeader>

          <p className="text-xs text-gray-400 leading-relaxed">
            You have unsaved changes on this branch. Switching branches will discard your uncommitted generations.
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowUnsavedDialog(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </Button>

            <Button
              variant="outline"
              onClick={discardAndSwitch}
              className="text-xs border-white/[0.08] text-gray-300 hover:bg-red-500/10 hover:text-red-400"
            >
              Discard & Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
