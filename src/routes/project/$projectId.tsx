import DefaultLayout from "@/lib/layouts/defaultLayout";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useAuthStore } from "@/lib/store/authStore";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
/* import {
  getBranches,
  deleteBranch,
  getProject,
  updateProject,
  sendInvite,
  getCollaborators,
  removeCollaborator,
} from "@/lib/api"; */
import * as api from "@/lib/api";
import { CreateBranchDialog } from "@/components/content/CreateBranchDialog";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useInitAuth from "@/lib/context/useInitAuth";
import { useImageStore } from "@/lib/store/useImageStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { CreatePullRequestDialog } from "@/components/content/project/PullRequestDialog";

type Branch = {
  _id: string;
  name: string;
  updatedAt: string;
};

type Project = {
  _id: string;
  name: string;
  visibility: "public" | "private";
  collaborators: {
    _id: string;
    username: string;
    email: string;
  }[];
};

export const Route = createFileRoute("/project/$projectId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = useParams({
    from: "/project/$projectId",
  });

  useInitAuth();

  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<
    "branches" | "pullRequests" | "settings"
  >("branches");

  const [open, setOpen] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches", projectId],
    queryFn: () => api.getBranches(projectId),
    enabled: !!projectId,
  });

  const columns: ColumnDef<Branch>[] = [
    {
      accessorKey: "name",
      cell: ({ row }) => (
        <span className="text-lg font-semibold">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "updatedAt",
      cell: ({ row }) => (
        <span className="text-sm text-gray-400">
          {new Date(row.original.updatedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "action",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          onClick={async () => {
            await api.deleteBranch(row.original._id);
            queryClient.invalidateQueries({
              queryKey: ["branches", projectId],
            });
          }}
        >
          <Trash2 size={16} />
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: branches,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <DefaultLayout>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("branches")}
            className={`px-4 py-2 rounded ${
              activeTab === "branches"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Branches
          </button>

          <button
            onClick={() => setActiveTab("pullRequests")}
            className={`px-4 py-2 rounded ${
              activeTab === "pullRequests"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Pull Requests
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded ${
              activeTab === "settings"
                ? "bg-gray-800 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Settings
          </button>
        </div>

        {activeTab === "branches" && (
          <Button onClick={() => setOpen(true)}>New Branch</Button>
        )}
      </div>

      {activeTab === "branches" && (
        <>
          <Table>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-gray-900/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 px-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <CreateBranchDialog
            open={open}
            onClose={() => setOpen(false)}
            projectId={projectId}
            branches={branches}
            onCreated={() =>
              queryClient.invalidateQueries({
                queryKey: ["branches", projectId],
              })
            }
          />
        </>
      )}

      {activeTab === "pullRequests" && (
        <PullRequestsTab projectId={projectId} />
      )}

      {activeTab === "settings" && <ProjectSettings projectId={projectId} />}
    </DefaultLayout>
  );
}

function ProjectSettings({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });
  const auth = useAuthStore();
  const { user } = useAuthStore();
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);

  const { data: collaboratorsData } = useQuery({
    queryKey: ["collaborators", projectId],
    queryFn: () => api.getCollaborators(projectId),
    enabled: !!projectId,
  });

  const removeMutation = useMutation({
    mutationFn: (collaboratorId: string) =>
      api.removeCollaborator(projectId, collaboratorId),
    onSuccess: () => {
      setRemoveUserId(null);
      queryClient.invalidateQueries({
        queryKey: ["collaborators", projectId],
      });
    },
  });

  const isOwner = collaboratorsData?.owner?._id === user?.id;

  const updateVisibility = useMutation({
    mutationFn: ({
      projectId,
      visibility,
    }: {
      projectId: string;
      visibility: "public" | "private";
    }) => api.updateProject(projectId, { visibility }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const addUser = useMutation({
    mutationFn: ({ projectId, email }: { projectId: string; email: string }) =>
      api.sendInvite(projectId, { email }),

    onSuccess: () => {
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  if (!project) return null;

  return (
    <div className="max-w-xl space-y-8">
      {/* ✅ VISIBILITY */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Visibility</h4>

        <div className="flex gap-6">
          {["private", "public"].map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input
                type="radio"
                checked={project?.project?.visibility === v}
                onChange={() =>
                  updateVisibility.mutate({
                    projectId,
                    visibility: v as "private" | "public",
                  })
                }
              />
              {v}
            </label>
          ))}
        </div>
      </div>

      {/* ✅ COLLABORATORS */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Collaborators</h4>

        <ul className="mb-4 space-y-1">
          {project?.collaborators?.map((c) => (
            <li key={c._id} className="text-sm text-gray-300">
              {c.username} ({c.email})
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@email.com"
            className="flex-1 px-3 py-2 bg-gray-900 border rounded"
          />
          <Button
            type="button"
            onClick={() => addUser.mutate({ projectId, email })}
          >
            Add
          </Button>
        </div>
      </div>
      {/* ✅ COLLABORATORS */}
      <div>
        {/* ✅ COLLAB LIST */}
        <ul className="space-y-2">
          {collaboratorsData?.collaborators.map((c) => (
            <li
              key={c.user._id}
              className="flex justify-between items-center p-3 bg-gray-900 rounded"
            >
              <div>
                <p className="text-sm font-medium">{c.user.username}</p>
                <p className="text-xs text-gray-400">{c.user.email}</p>
              </div>

              {/* ✅ REMOVE (OWNER ONLY) */}
              {isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRemoveUserId(c.user._id)}
                >
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>

        {/* ✅ CONFIRM REMOVE DIALOG */}
        <Dialog
          open={!!removeUserId}
          onOpenChange={() => setRemoveUserId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove collaborator</DialogTitle>
            </DialogHeader>

            <p className="text-sm text-gray-500">
              Are you sure you want to remove this collaborator? Their personal
              branch will be deleted.
            </p>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setRemoveUserId(null)}>
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={() => removeMutation.mutate(removeUserId!)}
                disabled={removeMutation.isPending}
              >
                {removeMutation.isPending ? "Removing..." : "Remove"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

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
      // ✅ Accept = merge
      await api.acceptPR(prId);

      // ✅ find main branch
      const mainBranch = branches.find((b: any) => b.isMain);
      if (!mainBranch) throw new Error("Main branch not found");

      // ✅ pull latest main
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
