import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query";
import { getPublicProject, forkProject } from "@/lib/api";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/lib/layouts/defaultLayout";

export const Route = createFileRoute("/public_repositories/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: publicProjects = [] } = useQuery({
    queryKey: ["public-projects"],
    queryFn: () => getPublicProject(""),
  });

  const handleForkClick = (project) => {
    console.log("project",project)
    setSelectedProject(project);
    setShowDialog(true);
  };

  const confirmFork = async () => {
    if (!selectedProject) return;

    await forkProject(selectedProject._id);
    setShowDialog(false);
  };

  return (
    <DefaultLayout>
      <h1 className="text-2xl font-bold mb-4">Public Repositories</h1>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="p-2">Project Name</th>
            <th className="p-2">Owner</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>

        <tbody>
          {publicProjects.map((p) => (
            <tr key={p._id} className="border-b border-gray-800">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.owner.username}</td>
              <td className="p-2">
                <Button onClick={() => handleForkClick(p)}>Fork</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Fork this project?</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-600">
            Are you sure you want to fork <strong>{selectedProject?.name}</strong>?
          </p>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmFork}>Yes, Fork</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DefaultLayout>
  );
}
