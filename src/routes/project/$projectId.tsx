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
import * as Table from "@/components/ui/table";

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
  const [openPR, setOpenPR] = useState(false);

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
          variant="destructive"
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
      <div className="h-full overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Project Details</h2>
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
              <Bread.BreadcrumbSeparator />
              <Bread.BreadcrumbItem>
                <Bread.BreadcrumbLink className="text-gray-400">
                  {project?.project?.name || "Loading..."}
                </Bread.BreadcrumbLink>
              </Bread.BreadcrumbItem>
            </Bread.BreadcrumbList>
          </Bread.Breadcrumb>
        </div>

        <Tabs defaultValue="branches" className="w-full">
          <TabsList variant="line" className="overflow-x-auto max-w-full">
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="pullRequests">Pull Requests</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          <TabsContent value="branches" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button
                variant="create_new"
                onClick={() => setOpen(true)}
              >
                New Branch
              </Button>
            </div>
            <Card className="rounded-2xl border border-white/[0.08] bg-[#0c0f18]/60 backdrop-blur-md overflow-hidden shadow-xl">
              <CardContent className="p-0 text-sm text-muted-foreground">
                <div className="overflow-x-auto w-full">
                  <Table.Table>
                    <Table.TableHeader className="bg-white/[0.02] border-b border-white/[0.06]">
                      <Table.TableRow className="hover:bg-transparent">
                        <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400">Branch name</Table.TableHead>
                        <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400 text-center">
                          Last updated on
                        </Table.TableHead>
                        <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400 text-right">
                          Action
                        </Table.TableHead>
                      </Table.TableRow>
                    </Table.TableHeader>
                    <Table.TableBody>
                      {table.getRowModel().rows.map((row) => (
                        <Table.TableRow
                          key={row.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <Table.TableCell key={cell.id} className="py-4 px-4 sm:px-6">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </Table.TableCell>
                          ))}
                        </Table.TableRow>
                      ))}
                    </Table.TableBody>
                  </Table.Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="pullRequests" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button
                variant="create_new"
                onClick={() => setOpenPR(true)}
              >
                Create Pull Request
              </Button>
            </div>
            <Card className="rounded-2xl border border-white/[0.08] bg-[#0c0f18]/60 backdrop-blur-md overflow-hidden shadow-xl">
              <CardContent className="p-4 text-sm text-muted-foreground overflow-x-auto">
                <PullRequestsTab
                  open={openPR}
                  setOpen={setOpenPR}
                  projectId={projectId}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            <Card className="rounded-2xl border border-white/[0.08] bg-[#0c0f18]/60 backdrop-blur-md overflow-hidden shadow-xl">
              <CardContent className="p-6 text-sm text-muted-foreground">
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
      </div>
    </DefaultLayout>
  );
}
