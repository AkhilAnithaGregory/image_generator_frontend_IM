import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useProjectStore } from "@/lib/store/useProjectStore";

export const CommitDialog = ({
  open,
  onClose,
  projectName,
  state,
}: {
  open: boolean;
  onClose: () => void;
  projectName: string;
  state: any;
}) => {
  const [message, setMessage] = useState("");

  const {
    backendProjectId,
    currentBranchId,
    lastKnownVersion,
    setBackendProject,
  } = useProjectStore();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async () => {
      let finalProjectId: string;
      let finalBranchId: string;

      if (!backendProjectId) {
        const project = await api.createProject({
          name: projectName,
        });
        console.log("projectAPI", project);
        finalProjectId = project._id;
        finalBranchId = project?.liveBranch;
      } else {
        if (!currentBranchId) {
          throw new Error("No active branch selected");
        }

        finalProjectId = backendProjectId;
        finalBranchId = currentBranchId;
      }
      const commit = await api.createCommit(finalBranchId, {
        state,
        message,
        lastKnownVersion,
      });

      return {
        projectId: finalProjectId,
        branchId: finalBranchId,
        version: commit?.version ?? (lastKnownVersion ?? 0) + 1,
      };
    },

    onSuccess: (data) => {
      setBackendProject(data.projectId, data.branchId, data.version);

      setMessage("");
      onClose();
    },
  });

  const handleConfirm = async () => {
    if (!message.trim()) return;
    await mutateAsync();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white text-black">
        <span className="text-lg"> Commit changes</span>
        <input
          placeholder="Enter commit message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border px-3 py-2 rounded w-full"
        />

        {error && (
          <p className="text-sm text-red-500">{(error as Error).message}</p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleConfirm}
            disabled={
              isPending ||
              !message.trim() ||
              (backendProjectId && !currentBranchId)
            }
          >
            {isPending ? "Pushing..." : "Push"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
