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
import { Separator } from "@/components/ui/separator";
import * as api from "@/lib/api";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useImageStore } from "@/lib/store/useImageStore";
import { getBranches, pullLatest } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";

export const HistorySideBar = ({
  onRequestPush,
}: {
  onRequestPush: (branchId: string) => void;
}) => {
  const {
    projects,
    currentProjectId,
    backendProjectId,
    currentBranchId,
    setCurrentBranchId,
    lastKnownVersion,
    setLastKnownVersion,
    hasUnsavedChanges,
    setHasUnsavedChanges,
    setProjectImages,
  } = useProjectStore();

  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;

  console.log("projects:", projects);
  console.log("currentProjectId:", currentProjectId);
  console.log("backendProjectId:", backendProjectId);
  console.log("currentBranchId:", currentBranchId);

  const { selectedNodeId, setSelectedNodeId, setLastGeneratedImage } =
    useImageStore();

  const { data: backendProjects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
    enabled: isLoggedIn,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const projectsToShow = isLoggedIn ? backendProjects : projects;
  console.log("projectsToShow", projectsToShow);
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

    const data = await pullLatest(branchId);
    useProjectStore.getState().updateProjectImages(data.state.images);

    setLastGeneratedImage(
      data.state.images[data.state.images.length - 1]?.src || null,
    );
    setSelectedNodeId(null);

    setLastKnownVersion(data.version);
    setHasUnsavedChanges(false);
  };

  const pushAndSwitch = () => {
    setShowUnsavedDialog(false);
    onRequestPush(pendingBranchId!);
  };

  const discardAndSwitch = async () => {
    await switchBranch(pendingBranchId!);
    setShowUnsavedDialog(false);
  };

  return (
    <div className="h-screen overflow-auto w-xl bg-black p-4 text-white space-y-4">
      {/* ✅ Branch dropdown ONLY in live mode */}
      {isLiveProject && (
        <select
          key={currentBranchId}
          value={currentBranchId}
          onChange={(e) => handleBranchChange(e.target.value)}
          className="w-full p-2 bg-gray-900 rounded text-white"
        >
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name}
            </option>
          ))}
        </select>
      )}

      <h3 className="text-xl font-semibold">Version History</h3>

      {/* ✅ History list */}
      <ul>
        {images.map((img) => (
          <li key={img.id} className="mb-6">
            <div
              onClick={() => {
                setSelectedNodeId(img.id);
                setLastGeneratedImage(img.src);
              }}
              className={`p-2 rounded cursor-pointer ${
                selectedNodeId === img.id ? "bg-gray-700" : "hover:bg-gray-800"
              }`}
            >
              <img src={img.src} className="w-full h-40 object-cover rounded" />

              <div className="text-xs text-gray-400 mt-2">{img.prompt}</div>
            </div>

            <Separator />
          </li>
        ))}
      </ul>

      {/* ✅ Unsaved indicator */}
      {hasUnsavedChanges && (
        <p className="text-xs text-yellow-400">● Unsaved changes</p>
      )}

      <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-black">Unsaved changes</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-400">
            You have unsaved changes. Switching branches will discard them.
          </p>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowUnsavedDialog(false)}>
              Cancel
            </Button>

            <Button variant="outline" onClick={discardAndSwitch}>
              Discard & Switch
            </Button>

            <Button onClick={pushAndSwitch}>Push & Switch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
