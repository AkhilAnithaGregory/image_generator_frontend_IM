import { useImageStore } from "@/lib/store/useImageStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { CreatePullRequestDialog } from "./PullRequestDialog";

export const PullRequestsTab = ({ projectId }: { projectId: string }) => {
  const {
    updateProjectImages,
    setLastKnownVersion,
    setHasUnsavedChanges,
    setCurrentBranchId,
  } = useProjectStore();
  const [open, setOpen] = useState(false);
  const { setLastGeneratedImage } = useImageStore();

  const { data: prs = [], refetch } = useQuery({
    queryKey: ["pullRequests", projectId],
    queryFn: () => api.getPRs(projectId),
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches", projectId],
    queryFn: () => api.getBranches(projectId),
  });

  const acceptMutation = useMutation({
    mutationFn: async (prId: string) => {
      await api.acceptPR(prId);
      const mainBranch = branches.find((b: any) => b.isMain);
      if (!mainBranch) throw new Error("Main branch not found");
      const latest = await api.pullLatest(mainBranch._id);
      return { latest, mainBranchId: mainBranch._id };
    },

    onSuccess: ({ latest, mainBranchId }) => {
      updateProjectImages(latest.state.images);
      setLastKnownVersion(latest.version);
      setCurrentBranchId(mainBranchId);
      setHasUnsavedChanges(false);

      const last = latest.state.images.at(-1);
      if (last) setLastGeneratedImage(last.src);

      refetch();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.rejectPR(id),
    onSuccess: () => refetch(),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>Create Pull Request</Button>
      </div>

      <CreatePullRequestDialog
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        branches={branches}
      />

      {prs.length === 0 && <p className="text-gray-400">No pull requests</p>}

      {prs.map((pr: any) => (
        <div
          key={pr._id}
          className="p-4 bg-gray-900 rounded border border-gray-700"
        >
          <p className="font-semibold">{pr.title}</p>
          <p className="text-sm text-gray-400">
            {pr.fromBranch.name} → {pr.toBranch.name}
          </p>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => acceptMutation.mutate(pr._id)}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? "Merging..." : "Accept"}
            </Button>

            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate(pr._id)}
              disabled={rejectMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};