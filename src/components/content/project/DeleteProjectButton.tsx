import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProject } from "@/lib/api";
import { ImBin } from "react-icons/im";

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setOpen(false);
    },
  });

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <ImBin />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-500">
            Are you sure you want to delete this project?  
            This action cannot be undone.
          </p>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              onClick={() => mutate()}
              disabled={isPending}
            >
              {isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
