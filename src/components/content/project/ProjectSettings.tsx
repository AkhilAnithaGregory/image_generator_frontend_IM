import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/lib/store/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import * as Dialog from "@/components/ui/dialog";

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
    <div className="max-w-xl space-y-8">
      {/* ✅ VISIBILITY */}
      <div>
        <h4 className="text-lg font-semibold mb-2">Visibility</h4>
        <Switch />
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
      <div>
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