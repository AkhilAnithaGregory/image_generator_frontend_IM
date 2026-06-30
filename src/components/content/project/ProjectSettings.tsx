import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/store/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FaLock } from "react-icons/fa";
import { ImBook } from "react-icons/im";
import * as api from "@/lib/api";
import * as Dialog from "@/components/ui/dialog";
import * as Table from "@/components/ui/table";

function ProjectSettings({ projectId }: { projectId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProject(projectId),
    enabled: !!projectId,
  });

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
    <div className="space-y-8 text-xl">
      <p className="text-start pb-3 text-2xl text-white">
        Collaborators and teams
      </p>
      <div className="flex items-center justify-between w-full">
        {project?.project?.visibility === "public" ? (
          <div className="flex gap-x-2">
            <span className="border border-gray-400 rounded-md p-5 flex items-center justify-center">
              <ImBook />
            </span>
            <div className="text-start">
              <p className="text-bold text-white">Public repository</p>
              <p>This repository is public and visible to anyone</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-x-2">
            <span className="border border-gray-400 rounded-md p-5 flex items-center justify-center">
              <FaLock />
            </span>
            <div className="text-start">
              <p className="text-bold text-white">Private repository</p>
              <p>Only those with access to this repository can view it</p>
            </div>
          </div>
        )}
        <div>
          <h4 className="text-lg font-semibold mb-2">Manage Visibility</h4>
          <Switch
            checked={project?.project?.visibility === "public"}
            className="w-50"
            onCheckedChange={(checked) =>
              updateVisibility.mutate({
                projectId,
                visibility: checked ? "public" : "private",
              })
            }
          />
        </div>
      </div>

      <div>
        <h4 className="text-start pb-3 text-2xl text-white">Manage access</h4>
        <div className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@email.com"
            className="flex-1 px-3 py-2 bg-gray-900 border rounded"
          />
          <Button
            type="button"
            variant="create_new"
            onClick={() => addUser.mutate({ projectId, email })}
          >
            Add People
          </Button>
        </div>
      </div>
      <div>
        <Table.Table>
          <Table.TableHeader className="bg-[#151B23]">
            <Table.TableRow className="text-lg">
              <Table.TableHead>Name</Table.TableHead>
              <Table.TableHead className="text-center">Email</Table.TableHead>
              <Table.TableHead className="text-center">Role</Table.TableHead>
              <Table.TableHead className="text-center">Action</Table.TableHead>
            </Table.TableRow>
          </Table.TableHeader>
          <Table.TableBody>
            <Table.TableRow className="hover:bg-gray-900/50">
              <Table.TableCell className="py-4 px-4">
                <p className="text-lg font-medium text-start">
                  {collaboratorsData?.owner?.username}
                </p>
              </Table.TableCell>
              <Table.TableCell className="py-4 px-4">
                <p className="text-lg text-gray-400">
                  {collaboratorsData?.owner?.email}
                </p>
              </Table.TableCell>
              <Table.TableCell className="py-4 px-4">
                <p className="text-lg text-gray-400">Owner</p>
              </Table.TableCell>
              <Table.TableCell className="py-4 px-4"></Table.TableCell>
            </Table.TableRow>
            {collaboratorsData?.collaborators.map((c) => (
              <Table.TableRow key={c.id} className="hover:bg-gray-900/50">
                <Table.TableCell className="py-4 px-4">
                  <p className="text-lg font-medium text-start">
                    {c.user.username}
                  </p>
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  <p className="text-lg text-gray-400">{c.user.email}</p>
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  <p className="text-lg text-gray-400">Collaborator</p>
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  {isOwner && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setRemoveUserId(c.user._id)}
                    >
                      Remove
                    </Button>
                  )}
                </Table.TableCell>
              </Table.TableRow>
            ))}
          </Table.TableBody>
        </Table.Table>

        <Dialog.Dialog
          open={!!removeUserId}
          onOpenChange={() => setRemoveUserId(null)}
        >
          <Dialog.DialogContent>
            <Dialog.DialogHeader>
              <Dialog.DialogTitle>Remove collaborator</Dialog.DialogTitle>
            </Dialog.DialogHeader>

            <p className="text-sm text-gray-500">
              Are you sure you want to remove this collaborator? Their personal
              branch will be deleted.
            </p>

            <Dialog.DialogFooter>
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
            </Dialog.DialogFooter>
          </Dialog.DialogContent>
        </Dialog.Dialog>
      </div>
    </div>
  );
}

export default ProjectSettings;
