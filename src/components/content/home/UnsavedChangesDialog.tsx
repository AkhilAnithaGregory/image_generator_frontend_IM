import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const UnsavedChangesDialog = ({
  open,
  onCancel,
  onDiscard,
  onPush,
}) => {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved changes</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-400">
          You have unsaved changes. Switching branches will discard them.
        </p>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onDiscard}>
            Discard & Switch
          </Button>
          <Button onClick={onPush}>
            Push & Switch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};