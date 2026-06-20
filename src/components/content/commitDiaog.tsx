import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useProjectStore } from "@/lib/store/useProjectStore";

export const CommitDialog = ({
  open,
  onClose,
  branchId,
  projectName,
  state,
}: {
  open: boolean;
  onClose: () => void;
  branchId?: string;
  projectName: string;
  state: any;
}) => {
  const [message, setMessage] = useState("");
  const {
    backendProjectId,
    lastKnownVersion,
    setBackendProject,
    currentBranchId
  } = useProjectStore();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: async () => {
      let finalProjectId: string;
      let finalBranchId: string;

      if (!backendProjectId) {
        // ✅ FIRST PUSH ONLY
        const project = await api.createProject({
          name: projectName,
        });

        finalProjectId = project._id;
        finalBranchId = project.liveBranch;
      } else {
        // ✅ EXISTING PROJECT
        if (!currentBranchId) {
          throw new Error("Branch ID not found");
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
        version: commit.version, // ✅ expect backend to return this
      };
    },

    onSuccess: (data) => {
      setBackendProject(
        data.projectId,
        data.branchId,
        data.version
      );

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
        <DialogHeader>
          <DialogTitle>Commit changes</DialogTitle>
        </DialogHeader>

        <input
          placeholder="Enter commit message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-500">
            {(error as Error).message}
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Pushing..." : "Push"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};