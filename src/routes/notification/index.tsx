import DefaultLayout from "@/lib/layouts/defaultLayout";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markAsRead,
  markAllRead,
  acceptInvite,
  rejectInvite,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";

export const Route = createFileRoute("/notification/")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();

  /* ✅ FETCH */
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });
  /* ✅ MUTATIONS */
console.log("notifications",notifications)
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectInvite(id),
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
      {/* ✅ HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Notifications</h3>

        <Button
          variant="outline"
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
        >
          {markAllMutation.isPending ? "Updating..." : "Mark all as read"}
        </Button>
      </div>

      {/* ✅ TABLE */}
      <Table>
        <TableBody>
          {notifications.length === 0 && (
            <TableRow>
              <TableCell className="text-center py-10 text-gray-400">
                No notifications
              </TableCell>
            </TableRow>
          )}

          {notifications.map((n: any) => {
            const isUnread = !n.isRead; // ✅ FIXED

            return (
              <TableRow
                key={n._id}
                className={`border-b ${
                  isUnread ? "bg-blue-900/20 font-semibold" : "bg-transparent"
                }`}
              >
                {/* ✅ MESSAGE */}
                <TableCell className="py-4 px-4">
                  <div>
                    <p>
                      {n.sender?.username} invited you to {n.project?.name}
                    </p>

                    <p className="text-xs text-gray-400">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </TableCell>

                {/* ✅ ACTIONS */}
                <TableCell className="flex gap-2 py-4">
                  {/* ✅ ACCEPT */}
                  {n.type === "PROJECT_INVITE" && (
                    <Button
                      size="sm"
                      disabled={acceptMutation.isPending}
                      onClick={() =>
                        acceptMutation.mutate(n.data.inviteId)
                      }
                    >
                      Accept
                    </Button>
                  )}

                  {/* ✅ REJECT */}
                  {n.type === "PROJECT_INVITE" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={rejectMutation.isPending}
                      onClick={() =>
                        rejectMutation.mutate(n.data.inviteId)
                      }
                    >
                      Reject
                    </Button>
                  )}

                  {/* ✅ MARK AS READ */}
                  {!n.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={markReadMutation.isPending}
                      onClick={() => markReadMutation.mutate(n._id)}
                    >
                      Mark as read
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </DefaultLayout>
  );
}
