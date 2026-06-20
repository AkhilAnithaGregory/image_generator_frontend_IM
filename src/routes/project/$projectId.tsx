import DefaultLayout from "@/lib/layouts/defaultLayout";
import { createFileRoute, useParams } from "@tanstack/react-router";
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
import {
  getBranches,
  deleteBranch,
  getProject,
  updateProject,
  sendInvite,
} from "@/lib/api";
import { CreateBranchDialog } from "@/components/content/CreateBranchDialog";
import { useState } from "react";

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

  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"branches" | "settings">(
    "branches",
  );
  const [open, setOpen] = useState(false);

  const { data: branches = [] } = useQuery({
    queryKey: ["branches", projectId],
    queryFn: () => getBranches(projectId),
    enabled: !!projectId,
  });

  const updateVisibility = useMutation({
    mutationFn: ({ projectId, visibility }) =>
      updateProject(projectId, { visibility }),
  });

  /* -------------------- BRANCH TABLE -------------------- */

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
            await deleteBranch(row.original._id);
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
      {/* -------------------- HEADER + TABS -------------------- */}
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

      {activeTab === "settings" && <ProjectSettings projectId={projectId} />}
    </DefaultLayout>
  );
}

function ProjectSettings({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    enabled: !!projectId,
  });
  const updateVisibility = useMutation({
    mutationFn: ({
      projectId,
      visibility,
    }: {
      projectId: string;
      visibility: "public" | "private";
    }) => updateProject(projectId, { visibility }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const addUser = useMutation({
    mutationFn: ({ projectId, email }: { projectId: string; email: string }) =>
      sendInvite(projectId, { email }),

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
    </div>
  );
}
