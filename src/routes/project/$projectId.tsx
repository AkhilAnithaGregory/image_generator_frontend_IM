import DefaultLayout from "@/lib/layouts/defaultLayout";
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as api from "@/lib/api";
import { CreateBranchDialog } from "@/components/content/project/CreateBranchDialog";
import { useState } from "react";
import useInitAuth from "@/lib/context/useInitAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Bread from "@/components/ui/breadcrumb";
import { PullRequestsTab } from "@/components/content/project/PullRequests";
import ProjectSettings from "@/components/content/project/ProjectSettings";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
  TableHeader,
  TableHead,
} from "@/components/ui/table";

type Branch = {
  _id: string;
  name: string;
  updatedAt: string;
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

  const [open, setOpen] = useState(false);

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });

  const { data: branches = [] } = useQuery({
    queryKey: ["branches", projectId],
    queryFn: () => api.getBranches(projectId),
    enabled: !!projectId,
  });

  const columns: ColumnDef<Branch>[] = [
    {
      accessorKey: "name",
      cell: ({ row }) => (
        <span className="text-lg font-semibold flex justify-start">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "updatedAt",
      cell: ({ row }) => (
        <span className="text-sm text-gray-400 text-center">
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
      <div className="px-4 py-4">
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
            <Bread.BreadcrumbSeparator />
            <Bread.BreadcrumbItem>
              <Bread.BreadcrumbLink>
                {project?.project?.name}
              </Bread.BreadcrumbLink>
            </Bread.BreadcrumbItem>
          </Bread.BreadcrumbList>
        </Bread.Breadcrumb>
      </div>
      <Tabs defaultValue="branches" className="w-full p-2">
        <TabsList variant="line">
          <TabsTrigger value="branches">Branch</TabsTrigger>
          <TabsTrigger value="pullRequests">Pull Request</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="branches">
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              <Button
                variant="secondary"
                className="flex ml-auto mb-4"
                onClick={() => setOpen(true)}
              >
                New Branch
              </Button>
              <Table>
                <TableHeader>
                  <TableRow className="text-lg">
                    <TableHead>Branch name</TableHead>
                    <TableHead className="text-center">
                      Last updated on
                    </TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
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
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pullRequests">
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              <PullRequestsTab projectId={projectId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardContent className="text-sm text-muted-foreground">
              <ProjectSettings projectId={projectId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
    </DefaultLayout>
  );
}
