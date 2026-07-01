import { Link } from "@tanstack/react-router";
import { RiImageCircleAiLine } from "react-icons/ri";
import { PiTreeStructure } from "react-icons/pi";
import { IoSettingsOutline } from "react-icons/io5";
import { VscGithubProject } from "react-icons/vsc";
import { IoIosNotificationsOutline } from "react-icons/io";
import { RiGitRepositoryLine } from "react-icons/ri";
import { MdAccountCircle } from "react-icons/md";
import { useAuthStore } from "@/lib/store/authStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IoLogOutOutline } from "react-icons/io5";
import { Button } from "../ui/button";

function Sidebar() {
  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;
  const handleLogout = () => {
    useAuthStore.getState().logout();
    localStorage.removeItem("image-storage");
    localStorage.removeItem("project-storage");
    window.location.href = "/";
  };
  return (
    <div className="min-w-16 w-16 h-screen flex flex-col justify-between text-white p-1 bg-black fixed left-0 top-0 bottom-0 z-10">
      <ul className="space-y-4 mt-5">
        <li className="flex flex-col mb-6 items-center">
          <img src="/logo.png" className="w-10" alt="logo" />
        </li>
        <li>
          <Tooltip>
            <TooltipTrigger>
              <Link to="/" className="flex flex-col items-center">
                <RiImageCircleAiLine size={20} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Generate Image</p>
            </TooltipContent>
          </Tooltip>
        </li>
        <li>
          <Tooltip>
            <TooltipTrigger>
              <Link
                to="/public_repositories"
                className="flex flex-col items-center"
              >
                <RiGitRepositoryLine size={20} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p>Public Repositories</p>
            </TooltipContent>
          </Tooltip>
        </li>
        {!!isLoggedIn && (
          <li>
            <Tooltip>
              <TooltipTrigger>
                <Link to="/project" className="flex flex-col items-center">
                  <VscGithubProject size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Project</p>
              </TooltipContent>
            </Tooltip>
          </li>
        )}
        {!!isLoggedIn && (
          <li>
            <Tooltip>
              <TooltipTrigger>
                <Link to="/version_tree" className="flex flex-col items-center">
                  <PiTreeStructure size={20} />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Version Tree</p>
              </TooltipContent>
            </Tooltip>
          </li>
        )}

        <li>
          <Tooltip>
            <TooltipTrigger>
              {!!isLoggedIn && (
                <Link to="/notification" className="flex flex-col items-center">
                  <IoIosNotificationsOutline size={20} />
                </Link>
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>Notifications</p>
            </TooltipContent>
          </Tooltip>
        </li>
        {/*
        <li>
         <Tooltip>
          <TooltipTrigger>
            {!!isLoggedIn && (
              <Link to="/settings" className="flex flex-col items-center">
                <IoSettingsOutline size={20} />
              </Link>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>Settings</p>
          </TooltipContent>
        </Tooltip> 
        </li>*/}
      </ul>
      <div className="p-4">
        <Tooltip>
          <TooltipTrigger>
            {!isLoggedIn && (
              <Link to="/auth/login" className="flex flex-col items-center">
                <MdAccountCircle size={20} />
              </Link>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>Login</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            {!!isLoggedIn && (
              <Button
                variant="ghost"
                onClick={() => {
                  handleLogout();
                }}
                className="flex flex-col items-center"
              >
                <IoLogOutOutline size={20} />
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>Logout</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export default Sidebar;
