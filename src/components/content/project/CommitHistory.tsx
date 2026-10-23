import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, GitCommitHorizontal, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as Dialog from "@/components/ui/dialog";
import * as Table from "@/components/ui/table";
import * as api from "@/lib/api";

type Branch = {
  _id: string;
  name: string;
};

type CommitImage = {
  id?: string;
  src?: string | null;
  prompt?: string;
};

type Commit = {
  _id: string;
  branch: string;
  branchName: string;
  version: number;
  message: string;
  createdAt: string;
  createdBy?: { username?: string };
  state?: { images?: CommitImage[] };
};

export function CommitHistory({
  projectId,
  branches,
}: {
  projectId: string;
  branches: Branch[];
}) {
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);

  const {
    data: commits = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project-commits", projectId, branches.map((branch) => branch._id)],
    queryFn: async () => {
      const branchCommits = await Promise.all(
        branches.map(async (branch) => {
          const items = (await api.getCommits(branch._id)) as Omit<Commit, "branchName">[];
          return items.map((commit) => ({ ...commit, branchName: branch.name }));
        }),
      );

      return branchCommits
        .flat()
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        );
    },
    enabled: branches.length > 0,
  });

  const snapshotImages = selectedCommit?.state?.images?.filter(
    (image) => typeof image.src === "string" && image.src.length > 0,
  ) ?? [];

  return (
    <>
      {isLoading && <p className="py-8 text-center text-gray-400">Loading commit history...</p>}
      {error && (
        <p role="alert" className="py-8 text-center text-red-400">
          {(error as Error).message || "Could not load commit history."}
        </p>
      )}
      {!isLoading && !error && commits.length === 0 && (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-gray-400">
          <GitCommitHorizontal size={22} />
          <p>No commits yet.</p>
        </div>
      )}
      {commits.length > 0 && (
        <div className="overflow-x-auto">
          <Table.Table>
            <Table.TableHeader className="bg-white/2">
              <Table.TableRow>
                <Table.TableHead>Commit</Table.TableHead>
                <Table.TableHead>Branch</Table.TableHead>
                <Table.TableHead>Author</Table.TableHead>
                <Table.TableHead>Date</Table.TableHead>
                <Table.TableHead className="text-right">Snapshot</Table.TableHead>
              </Table.TableRow>
            </Table.TableHeader>
            <Table.TableBody>
              {commits.map((commit) => (
                <Table.TableRow key={commit._id}>
                  <Table.TableCell className="min-w-52">
                    <p className="font-medium text-white">{commit.message}</p>
                    <p className="mt-1 text-xs text-gray-500">Version {commit.version}</p>
                  </Table.TableCell>
                  <Table.TableCell>{commit.branchName}</Table.TableCell>
                  <Table.TableCell>{commit.createdBy?.username || "Unknown"}</Table.TableCell>
                  <Table.TableCell className="whitespace-nowrap">
                    {new Date(commit.createdAt).toLocaleString()}
                  </Table.TableCell>
                  <Table.TableCell className="text-right">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCommit(commit)}
                    >
                      <Eye size={15} />
                      View
                    </Button>
                  </Table.TableCell>
                </Table.TableRow>
              ))}
            </Table.TableBody>
          </Table.Table>
        </div>
      )}

      <Dialog.Dialog
        open={!!selectedCommit}
        onOpenChange={(open) => !open && setSelectedCommit(null)}
      >
        <Dialog.DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto border-white/10 bg-[#0c0f18] text-white">
          <Dialog.DialogHeader>
            <Dialog.DialogTitle>{selectedCommit?.message}</Dialog.DialogTitle>
            <p className="text-sm text-gray-400">
              {selectedCommit?.branchName} · Version {selectedCommit?.version} ·{" "}
              {selectedCommit && new Date(selectedCommit.createdAt).toLocaleString()}
            </p>
          </Dialog.DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <ImageIcon size={16} />
              <span>{snapshotImages.length} image{snapshotImages.length === 1 ? "" : "s"} in this snapshot</span>
            </div>
            {snapshotImages.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {snapshotImages.map((image, index) => (
                  <figure key={image.id || `${selectedCommit?._id}-${index}`} className="overflow-hidden rounded-md border border-white/10 bg-black/20">
                    <img
                      src={image.src || undefined}
                      alt={image.prompt || `Image ${index + 1} in commit snapshot`}
                      className="aspect-square w-full object-contain"
                    />
                    {image.prompt && (
                      <figcaption className="border-t border-white/10 p-2 text-xs text-gray-400">
                        {image.prompt}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">
                This commit snapshot contains no viewable images.
              </p>
            )}
          </div>
        </Dialog.DialogContent>
      </Dialog.Dialog>
    </>
  );
}