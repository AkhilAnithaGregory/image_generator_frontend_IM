import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getPublicProject, forkProject } from "@/lib/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/lib/layouts/defaultLayout";
import * as Table from "@/components/ui/table";
import * as Dialog from "@/components/ui/dialog";
import { FaCodeFork } from "react-icons/fa6";
import type { projectType } from "@/lib/types/projectTypes";
import { useAuthStore } from "@/lib/store/authStore";

export const Route = createFileRoute("/public_repositories/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;
  const [selectedProject, setSelectedProject] = useState<projectType>(null);
  const [showDialog, setShowDialog] = useState(false);

  const { data: publicProjects = [] } = useQuery({
    queryKey: ["public-projects"],
    queryFn: () => getPublicProject(""),
  });

  const handleForkClick = (project: projectType) => {
    if (!isLoggedIn) {
      alert("You need to be logged in to fork a project.");
      navigate({ to: "/auth/login" });
    } else {
      setSelectedProject(project);
      setShowDialog(true);
    }
  };

  const confirmFork = async () => {
    if (!selectedProject) return;

    await forkProject(selectedProject._id);
    setShowDialog(false);
  };

  return (
    <DefaultLayout>
      <div className="px-4 py-4">
        <h2 className="text-start">Repositories</h2>
      </div>

      <div className="p-2">
        <Table.Table>
          <Table.TableHeader className="bg-white text-black">
            <Table.TableRow className="text-lg">
              <Table.TableHead className="rounded-tl-lg text-center">
                Sl.No
              </Table.TableHead>
              <Table.TableHead className="text-center">
                Project Name
              </Table.TableHead>
              <Table.TableHead className="text-center">
                Owner Name
              </Table.TableHead>
              <Table.TableHead className="text-center">
                Created at
              </Table.TableHead>
              <Table.TableHead className="text-center rounded-tr-lg">
                Action
              </Table.TableHead>
            </Table.TableRow>
          </Table.TableHeader>
          <Table.TableBody>
            {publicProjects.map((p: projectType, index: number) => (
              <Table.TableRow className="hover:bg-gray-900/50">
                <Table.TableCell className="py-4 px-4">
                  {index + 1}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  {p.name}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  {p.owner.username}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  {new Date(p.createdAt).toLocaleDateString()}
                </Table.TableCell>
                <Table.TableCell className="py-4 px-4">
                  <Button
                    variant="secondary"
                    onClick={() => handleForkClick(p)}
                  >
                    <FaCodeFork /> Fork
                  </Button>
                </Table.TableCell>
              </Table.TableRow>
            ))}
          </Table.TableBody>
        </Table.Table>
      </div>

      <Dialog.Dialog open={showDialog} onOpenChange={setShowDialog}>
        <Dialog.DialogContent className="bg-white">
          <span className="text-black text-xl">Fork this project?</span>
          <p className="text-sm text-gray-600">
            Are you sure you want to fork{" "}
            <strong>{selectedProject?.name}</strong>?
          </p>
          <div className="flex items-center gap-x-2 justify-end">
            <Button
              variant="destructive"
              className="w-20"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="secondary" className="w-30" onClick={confirmFork}>
              Yes, Fork
            </Button>
          </div>
        </Dialog.DialogContent>
      </Dialog.Dialog>
    </DefaultLayout>
  );
}
