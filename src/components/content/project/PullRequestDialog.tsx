import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import * as api from "@/lib/api";

export const CreatePullRequestDialog = ({
  open,
  onClose,
  projectId,
  branches,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  branches: any[];
}) => {
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");
  const [title, setTitle] = useState("");

  const handleCreate = async () => {
    if (!fromBranch || !toBranch || !title) return;

    await api.createPR({
      projectId,
      fromBranchId: fromBranch,
      toBranchId: toBranch,
      title,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Pull Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <span>Choose a head ref</span>
          <select
            value={fromBranch}
            onChange={(e) => setFromBranch(e.target.value)}
            className="w-full p-2 bg-gray-900 border rounded"
          >
            <option value="">Source branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
          <span>Choose a base ref</span>
          <select
            value={toBranch}
            onChange={(e) => setToBranch(e.target.value)}
            className="w-full p-2 bg-gray-900 border rounded"
          >
            <option value="">Target branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
          <span>Commit Message</span>
          <input
            placeholder="Pull request message"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <DialogFooter>
          <Button variant="destructive" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="create_new" onClick={handleCreate}>Create pull request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
