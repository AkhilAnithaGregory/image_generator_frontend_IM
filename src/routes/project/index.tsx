import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import DefaultLayout from "@/lib/layouts/defaultLayout";
import { useQuery } from "@tanstack/react-query";
import { getProjects } from "@/lib/api";
import { DeleteProjectButton } from "@/components/content/project/DeleteProjectButton";
import * as Bread from "@/components/ui/breadcrumb";

type Project = {
  _id: string;
  name: string;
  visibility: "public" | "private";
  updatedAt: string;
  owner: {
    username: string;
    email: string;
  };
};

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "Project",
    cell: ({ row }) => {
      const project = row.original;

      return (
        <div className="flex gap-x-4 items-center">
          <Link
            to="/project/$projectId"
            params={{ projectId: project._id }}
            className="text-2xl font-semibold text-blue-500 hover:underline"
          >
            {project.name}
          </Link>

          <span className="text-xs text-gray-400 border rounded-full px-2 py-1">
            {project.visibility === "public" ? "Public" : "Private"}
          </span>
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
        <span className="text-sm text-gray-400">
          last updated on <br />
          {date.toLocaleDateString()}{" "}
          {date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      );
    },
  },

  {
    id: "delete",
    header: "",
    cell: ({ row }) => <DeleteProjectButton projectId={row.original._id} />,
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
        <p className="text-gray-400">Loading projects…</p>
      </DefaultLayout>
    );
  }

  if (error) {
    return (
      <DefaultLayout>
        <p className="text-red-500">Failed to load projects</p>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="px-4 pt-4">
        <h2 className="text-start">Projects</h2>
        <Bread.Breadcrumb>
          <Bread.BreadcrumbList>
            <Bread.BreadcrumbItem>
              <Bread.BreadcrumbLink href="/">Home</Bread.BreadcrumbLink>
            </Bread.BreadcrumbItem>
            <Bread.BreadcrumbSeparator />
            <Bread.BreadcrumbItem>
              <Bread.BreadcrumbLink href="/project">
                Project
              </Bread.BreadcrumbLink>
            </Bread.BreadcrumbItem>
          </Bread.BreadcrumbList>
        </Bread.Breadcrumb>
      </div>
      <div className="overflow-hidden m-4">
        <Table>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="py-5" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </DefaultLayout>
  );
}
