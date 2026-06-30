import { useImageStore } from "@/lib/store/useImageStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { CreatePullRequestDialog } from "./PullRequestDialog";
import { FaCodePullRequest } from "react-icons/fa6";
import * as api from "@/lib/api";
import * as Table from "@/components/ui/table";

export const PullRequestsTab = ({
  projectId,
  open,
  setOpen,
}: {
  projectId: string;
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const {
    updateProjectImages,
    setLastKnownVersion,
    setHasUnsavedChanges,
    setCurrentBranchId,
  } = useProjectStore();
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
      <CreatePullRequestDialog
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        branches={branches}
      />

      {prs.length === 0 && (
        <div className="text-white flex gap-y-2 items-center justify-center min-h-50 flex-col">
          <FaCodePullRequest size={20} />
          <p className="text-2xl">There aren’t any open pull requests.</p>
        </div>
      )}

      {prs.length != 0 && (
        <Table.Table>
          <Table.TableHeader className="bg-[#151B23]">
            <Table.TableRow className="text-lg">
              <Table.TableHead>Message</Table.TableHead>
              <Table.TableHead className="text-center">
                Created by
              </Table.TableHead>
              <Table.TableHead className="text-center">
                Merging Branch
              </Table.TableHead>
              <Table.TableHead className="text-center">Action</Table.TableHead>
            </Table.TableRow>
          </Table.TableHeader>
          <Table.TableBody>
            {prs?.map((pr) => (
              <Table.TableRow key={pr._id} className="hover:bg-gray-900/50">
                <Table.TableCell className="py-4 px-4">
                  {pr.title}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  {pr.createdBy.username}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  {pr.fromBranch.name} → {pr.toBranch.name || "main"}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  <Button
                    variant="create_new"
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
                </Table.TableCell>
              </Table.TableRow>
            ))}
          </Table.TableBody>
        </Table.Table>
      )}
    </div>
  );
};
