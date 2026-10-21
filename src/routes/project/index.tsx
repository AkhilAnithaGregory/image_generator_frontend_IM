import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DefaultLayout from "@/lib/layouts/defaultLayout";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/lib/api";
import { DeleteProjectButton } from "@/components/content/project/DeleteProjectButton";
import * as Bread from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { openBackendProject } from "@/lib/helper/openBackendProject";
import { FiEye, FiFolder } from "react-icons/fi";

type Project = {
  _id: string;
  name: string;
  visibility: "public" | "private";
  liveBranch?: string;
  updatedAt: string;
  owner: {
    username: string;
    email: string;
  };
};

function ViewProjectButton({ project }: { project: Project }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleView = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await openBackendProject(project);
      navigate({ to: "/" });
    } catch (err) {
      console.error("Failed to open project:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleView}
      disabled={loading}
      className="gap-1.5 text-xs bg-white/[0.04] border-white/[0.08] hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 text-gray-300 transition-all rounded-xl cursor-pointer"
    >
      {loading ? <Spinner size="sm" /> : <FiEye size={14} />}
      View
    </Button>
  );
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => {
      const project = row.original;

      return (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <FiFolder size={18} />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <Link
              to="/project/$projectId"
              params={{ projectId: project._id }}
              className="text-base sm:text-lg font-semibold text-white hover:text-blue-400 transition-colors"
            >
              {project.name}
            </Link>

            <span className="text-[10px] sm:text-xs text-gray-400 border border-white/[0.08] bg-white/[0.02] rounded-full px-2 py-0.5 w-fit">
              {project.visibility === "public" ? "Public" : "Private"}
            </span>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"));
      return (
        <span className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
          {date.toLocaleDateString()}{" "}
          <span className="text-gray-500">
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </span>
      );
    },
  },

  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="flex items-center gap-2 justify-end">
        <ViewProjectButton project={row.original} />
        <DeleteProjectButton projectId={row.original._id} />
      </div>
    ),
  },
];

export const Route = createFileRoute("/project/")({
  component: RouteComponent,
});

function RouteComponent() {
  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-full text-gray-400">
          <Spinner size="md" />
          <span className="ml-2 text-sm">Loading projects…</span>
        </div>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <div className="p-6 text-red-400 text-sm">
          Failed to load projects. Please refresh.
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="h-full overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Header and Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Projects
            </h1>
            <Bread.Breadcrumb>
              <Bread.BreadcrumbList>
                <Bread.BreadcrumbItem>
                  <Bread.BreadcrumbLink href="/">Home</Bread.BreadcrumbLink>
                </Bread.BreadcrumbItem>
                <Bread.BreadcrumbSeparator />
                <Bread.BreadcrumbItem>
                  <Bread.BreadcrumbLink href="/project">
                    Projects
                  </Bread.BreadcrumbLink>
                </Bread.BreadcrumbItem>
              </Bread.BreadcrumbList>
            </Bread.Breadcrumb>
          </div>
          <span className="text-xs text-gray-500 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06] w-fit font-mono">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </span>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0f18]/60 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto w-full">
            <Table>
              <TableHeader className="bg-white/[0.02] border-b border-white/[0.06]">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b-white/[0.06] hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs font-medium text-gray-400 py-3.5 px-4 sm:px-6">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell className="py-4 px-4 sm:px-6" key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-32 text-center text-sm text-gray-500"
                    >
                      No projects found. Create one by generating an image!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
