// components/branches/CreateBranchDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createBranch } from "@/lib/api";
import { FaCodeBranch } from "react-icons/fa6";

type Props = {
  open: boolean;
  onClose: () => void;
  projectId: string;
  branches: { _id: string; name: string }[];
  onCreated: () => void;
};

export const CreateBranchDialog = ({
  open,
  onClose,
  projectId,
  branches,
  onCreated,
}: Props) => {
  const [name, setName] = useState("");
  const [fromBranchId, setFromBranchId] = useState<string | undefined>("");
  console.log("fromBranchId", fromBranchId);
  const handleCreate = async () => {
    if (!name.trim()) return;

    await createBranch(projectId, {
      name,
      fromBranchId,
    });

    setName("");
    setFromBranchId(undefined);
    onCreated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-white">
        <span className="text-black text-xl">Create Branch</span>

        <input
          id="branch_name"
          placeholder="New branch name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-md border border-black bg-white/5 px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-xl"
        />

        <span className="text-lg">Source</span>
        <select
          id="existing_branch_name"
          className="w-full p-2 rounded border border-black"
          onChange={(e) => setFromBranchId(e.target.value || undefined)}
        >
          <option value="">Start empty</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              <FaCodeBranch /> {b.name}
            </option>
          ))}
        </select>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
