import DefaultLayout from "@/lib/layouts/defaultLayout";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { openBackendProject } from "@/lib/helper/openBackendProject";
import * as Bread from "@/components/ui/breadcrumb";
import * as Table from "@/components/ui/table";

export const Route = createFileRoute("/notification/")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: api.getNotifications,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: api.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (inviteId: string) => api.acceptInvite(inviteId),

    onSuccess: async () => {
      const projects = await api.getProjects();
      const acceptedProject = projects.find(
        (p: { _id: string }) => p._id === notifications.project._id,
      );

      if (acceptedProject) {
        await openBackendProject(acceptedProject);
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => api.rejectInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  if (isLoading) {
    return (
      <DefaultLayout>
        <p className="text-gray-400">Loading notifications...</p>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="h-full overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Notifications
            </h1>
            <Bread.Breadcrumb>
              <Bread.BreadcrumbList>
                <Bread.BreadcrumbItem>
                  <Bread.BreadcrumbLink href="/">Home</Bread.BreadcrumbLink>
                </Bread.BreadcrumbItem>
                <Bread.BreadcrumbSeparator />
                <Bread.BreadcrumbItem>
                  <Bread.BreadcrumbLink href="/notification">
                    Notifications
                  </Bread.BreadcrumbLink>
                </Bread.BreadcrumbItem>
              </Bread.BreadcrumbList>
            </Bread.Breadcrumb>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="create_new"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="w-fit"
            >
              {markAllMutation.isPending ? "Updating..." : "Mark all as read"}
            </Button>
          )}
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0f18]/60 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto w-full">
            <Table.Table>
              <Table.TableHeader className="bg-white/[0.02] border-b border-white/[0.06]">
                <Table.TableRow className="hover:bg-transparent">
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400">Message</Table.TableHead>
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400 text-center">Date & Time</Table.TableHead>
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400 text-center">Status</Table.TableHead>
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400 text-right">Action</Table.TableHead>
                </Table.TableRow>
              </Table.TableHeader>
              <Table.TableBody>
                {notifications.length === 0 && (
                  <Table.TableRow>
                    <Table.TableCell colSpan={4} className="text-center py-12 text-sm text-gray-500">
                      No notifications
                    </Table.TableCell>
                  </Table.TableRow>
                )}

                {notifications.map((n) => {
                  const isUnread = !n.isRead;

                  return (
                    <Table.TableRow
                      key={n._id}
                      className={`border-b border-white/[0.04] transition-colors ${
                        isUnread ? "bg-blue-500/[0.06] font-medium" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      <Table.TableCell className="py-4 px-4 sm:px-6 text-start text-sm text-gray-200">
                        {n.message}
                      </Table.TableCell>
                      <Table.TableCell className="py-4 px-4 sm:px-6 text-center text-xs text-gray-400 whitespace-nowrap">
                        {new Date(n.createdAt).toLocaleString()}
                      </Table.TableCell>
                      <Table.TableCell className="py-4 px-4 sm:px-6 text-center text-xs text-gray-400">
                        <span className="border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 rounded-full text-[11px] font-mono">
                          {n.type}
                        </span>
                      </Table.TableCell>
                      <Table.TableCell className="py-4 px-4 sm:px-6">
                        <div className="flex gap-2 justify-end">
                          {n.type === "PROJECT_INVITE" && (
                            <Button
                              variant="create_new"
                              size="sm"
                              disabled={acceptMutation.isPending}
                              onClick={() => acceptMutation.mutate(n.data.inviteId)}
                            >
                              Accept
                            </Button>
                          )}

                          {n.type === "PROJECT_INVITE" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={rejectMutation.isPending}
                              onClick={() => rejectMutation.mutate(n.data.inviteId)}
                            >
                              Reject
                            </Button>
                          )}

                          {!n.isRead && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={markReadMutation.isPending}
                              onClick={() => markReadMutation.mutate(n._id)}
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </Table.TableCell>
                    </Table.TableRow>
                  );
                })}
              </Table.TableBody>
            </Table.Table>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
