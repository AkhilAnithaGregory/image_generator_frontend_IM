import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { IoCloudUploadOutline } from "react-icons/io5";
import { Spinner } from "@/components/ui/spinner";
import { LuRefreshCw } from "react-icons/lu";
import { toast } from "sonner";

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
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const {
    backendProjectId,
    currentBranchId,
    lastKnownVersion,
    setBackendProject,
    setHasUnsavedChanges,
  } = useProjectStore();

  const { mutateAsync, isPending, error, reset } = useMutation({
    mutationFn: async () => {
      let finalProjectId: string;
      let finalBranchId: string;

      if (!backendProjectId) {
        const project = await api.createProject({
          name: projectName,
        });
        finalProjectId = project._id;
        finalBranchId = project?.liveBranch;
      } else {
        if (!currentBranchId) {
          throw new Error("No active branch selected");
        }
        finalProjectId = backendProjectId;
        finalBranchId = currentBranchId;
      }

      // Safe push check: fetch the latest remote version so we avoid 409 conflict
      let effectiveVersion = lastKnownVersion;
      if (backendProjectId && finalBranchId) {
        try {
          const latestRemote = await api.pullLatest(finalBranchId);
          if (latestRemote && typeof latestRemote.version === "number") {
            if (lastKnownVersion != null && latestRemote.version !== lastKnownVersion) {
              setSyncNotice(
                `Synced branch version from v${lastKnownVersion} to remote v${latestRemote.version} for safe push.`
              );
            }
            effectiveVersion = latestRemote.version;
          }
        } catch {
          // If no commits yet on branch or initial commit, continue with existing version
        }
      }

      const commit = await api.createCommit(finalBranchId, {
        state,
        message,
        lastKnownVersion: effectiveVersion,
      });

      return {
        projectId: finalProjectId,
        branchId: finalBranchId,
        version: commit?.version ?? (effectiveVersion ?? 0) + 1,
      };
    },

    onSuccess: (data) => {
      setBackendProject(data.projectId, data.branchId, data.version);
      setHasUnsavedChanges(false);
      setMessage("");
      setSyncNotice(null);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["remote-branch-version"] });
      toast.success("Pushed Successfully");
      onClose();
    },

    onError: (err: any) => {
      toast.error(err?.message ? `Failed to push: ${err.message}` : "Failed to push");
    },
  });

  const handleConfirm = async () => {
    if (!message.trim()) return;
    await mutateAsync();
  };

  const handleClose = () => {
    reset();
    setSyncNotice(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#0f131d] border border-white/[0.08] text-white max-w-md p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <IoCloudUploadOutline size={18} />
            </div>
            <DialogTitle className="text-base font-semibold text-white">
              Push Changes
            </DialogTitle>
          </div>
          <p className="text-xs text-gray-400">
            Commit your latest generated versions to the cloud branch.
          </p>
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-gray-500 block mb-1.5 font-medium">
              Commit Message
            </label>
            <input
              placeholder="e.g. Added cyberpunk samurai variations"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && message.trim() && !isPending) {
                  e.preventDefault();
                  handleConfirm();
                }
              }}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-gray-600 outline-none focus:border-white/[0.2] transition-colors"
            />
          </div>

          {syncNotice && (
            <p className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-lg flex items-center gap-1.5">
              <LuRefreshCw size={13} className="shrink-0 animate-spin" />
              <span>{syncNotice}</span>
            </p>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
              <p className="text-xs text-red-400">{(error as Error).message}</p>
              <Button
                type="button"
                onClick={handleConfirm}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs py-1.5 rounded-lg"
              >
                Retry Push
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs rounded-xl"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleConfirm}
            disabled={
              isPending ||
              !message.trim() ||
              (backendProjectId && !currentBranchId)
            }
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-2 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Spinner />
                <span>Pushing...</span>
              </>
            ) : (
              <>
                <IoCloudUploadOutline size={15} />
                <span>Push to Cloud</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
