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
      <div className="px-4 pt-4">
        <h2 className="text-start">Notifications</h2>
        <Bread.Breadcrumb>
          <Bread.BreadcrumbList>
            <Bread.BreadcrumbItem>
              <Bread.BreadcrumbLink href="/">Home</Bread.BreadcrumbLink>
            </Bread.BreadcrumbItem>
            <Bread.BreadcrumbSeparator />
            <Bread.BreadcrumbItem>
              <Bread.BreadcrumbLink href="/notification">
                Notification
              </Bread.BreadcrumbLink>
            </Bread.BreadcrumbItem>
          </Bread.BreadcrumbList>
        </Bread.Breadcrumb>
      </div>
      <div className="w-full flex justify-end p-2">
        <Button
          variant="create_new"
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
        >
          {markAllMutation.isPending ? "Updating..." : "Mark all as read"}
        </Button>
      </div>
      <Table.Table>
        <Table.TableHeader>
          <Table.TableRow className="text-lg">
            <Table.TableHead>Message</Table.TableHead>
            <Table.TableHead className="text-center">Date&Time</Table.TableHead>
            <Table.TableHead className="text-center">Status</Table.TableHead>
            <Table.TableHead className="text-center">Action</Table.TableHead>
          </Table.TableRow>
        </Table.TableHeader>
        <Table.TableBody>
          {notifications.length === 0 && (
            <Table.TableRow>
              <Table.TableCell className="text-center py-10 text-gray-400">
                No notifications
              </Table.TableCell>
            </Table.TableRow>
          )}

          {notifications.map((n) => {
            const isUnread = !n.isRead;

            return (
              <Table.TableRow
                key={n._id}
                className={`border-b text-lg ${
                  isUnread ? "bg-blue-900/20 font-semibold" : "bg-transparent"
                }`}
              >
                <Table.TableCell className="py-4 px-4 text-start">
                  {n.message}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  {new Date(n.createdAt).toLocaleString()}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">{n.type}</Table.TableCell>
                <Table.TableCell className="flex gap-2 py-4 justify-end">
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
                      Mark as read
                    </Button>
                  )}
                </Table.TableCell>
              </Table.TableRow>
            );
          })}
        </Table.TableBody>
      </Table.Table>
    </DefaultLayout>
  );
}
