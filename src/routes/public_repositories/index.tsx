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
      <div className="h-full overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
              Public Repositories
            </h1>
            <p className="text-xs text-gray-500">Explore community prompts and fork projects into your workspace</p>
          </div>
          <span className="text-xs text-gray-500 bg-white/[0.04] px-3 py-1 rounded-full border border-white/[0.06] w-fit font-mono">
            {publicProjects.length} {publicProjects.length === 1 ? "repository" : "repositories"}
          </span>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0f18]/60 backdrop-blur-md overflow-hidden shadow-xl">
          <div className="overflow-x-auto w-full">
            <Table.Table>
              <Table.TableHeader className="bg-white/[0.02] border-b border-white/[0.06]">
                <Table.TableRow className="hover:bg-transparent">
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400 text-center w-16">
                    #
                  </Table.TableHead>
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400">
                    Project Name
                  </Table.TableHead>
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400">
                    Owner
                  </Table.TableHead>
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400 text-center">
                    Created At
                  </Table.TableHead>
                  <Table.TableHead className="py-3.5 px-4 sm:px-6 text-xs text-gray-400 text-right">
                    Action
                  </Table.TableHead>
                </Table.TableRow>
              </Table.TableHeader>
              <Table.TableBody>
                {publicProjects.length === 0 ? (
                  <Table.TableRow>
                    <Table.TableCell colSpan={5} className="h-32 text-center text-sm text-gray-500">
                      No public repositories found.
                    </Table.TableCell>
                  </Table.TableRow>
                ) : (
                  publicProjects.map((p: projectType, index: number) => (
                    <Table.TableRow
                      key={p._id || index}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                    >
                      <Table.TableCell className="py-4 px-4 sm:px-6 text-center text-xs text-gray-500 font-mono">
                        {index + 1}
                      </Table.TableCell>
                      <Table.TableCell className="py-4 px-4 sm:px-6 font-medium text-white text-sm">
                        {p.name}
                      </Table.TableCell>
                      <Table.TableCell className="py-4 px-4 sm:px-6 text-xs text-gray-400">
                        {p.owner?.username || "Anonymous"}
                      </Table.TableCell>
                      <Table.TableCell className="py-4 px-4 sm:px-6 text-center text-xs text-gray-500 whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </Table.TableCell>
                      <Table.TableCell className="py-4 px-4 sm:px-6 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleForkClick(p)}
                          className="gap-1.5 text-xs bg-white/[0.04] border border-white/[0.08] hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 text-gray-300 rounded-xl cursor-pointer"
                        >
                          <FaCodeFork size={12} /> Fork
                        </Button>
                      </Table.TableCell>
                    </Table.TableRow>
                  ))
                )}
              </Table.TableBody>
            </Table.Table>
          </div>
        </div>
      </div>

      <Dialog.Dialog open={showDialog} onOpenChange={setShowDialog}>
        <Dialog.DialogContent className="bg-[#0f131d] border border-white/[0.08] text-white max-w-sm rounded-2xl shadow-2xl p-6">
          <Dialog.DialogHeader>
            <Dialog.DialogTitle className="text-base font-semibold text-white">Fork Project</Dialog.DialogTitle>
          </Dialog.DialogHeader>
          <p className="text-xs text-gray-400 my-2">
            Are you sure you want to fork <strong className="text-white">{selectedProject?.name}</strong> to your workspace?
          </p>
          <div className="flex items-center gap-2 justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-xs bg-white/[0.04] border-white/[0.08] text-gray-400 hover:text-white rounded-xl"
              onClick={() => setShowDialog(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-xl"
              onClick={confirmFork}
            >
              Yes, Fork
            </Button>
          </div>
        </Dialog.DialogContent>
      </Dialog.Dialog>
    </DefaultLayout>
  );
}
