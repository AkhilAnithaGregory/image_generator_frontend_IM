import { Link } from "@tanstack/react-router";
import { RiImageCircleAiLine, RiGitRepositoryLine } from "react-icons/ri";
import { PiTreeStructure } from "react-icons/pi";
import { VscGithubProject } from "react-icons/vsc";
import { IoIosNotificationsOutline } from "react-icons/io";
import { MdAccountCircle } from "react-icons/md";
import { useAuthStore } from "@/lib/store/authStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IoLogOutOutline } from "react-icons/io5";
import useInitAuth from "@/lib/context/useInitAuth";

function Sidebar() {
  useInitAuth();
  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;

  const handleLogout = () => {
    useAuthStore.getState().logout();
    localStorage.removeItem("image-storage");
    localStorage.removeItem("project-storage");
    window.location.href = "/";
  };

  const navItem = (to: string, icon: React.ReactNode, label: string) => (
    <li>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            to={to}
            className="flex items-center justify-center w-10 h-10 md:w-9 md:h-9 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all duration-150 active:scale-95"
            activeProps={{
              className: "flex items-center justify-center w-10 h-10 md:w-9 md:h-9 rounded-xl text-blue-400 bg-blue-500/10 border border-blue-500/20 shadow-sm",
            }}
          >
            {icon}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="hidden md:block">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </li>
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 h-14 w-full md:fixed md:top-0 md:bottom-0 md:left-0 md:w-14 md:h-screen flex flex-row md:flex-col  items-center py-1.5 px-3 md:py-4 md:px-1.5 z-50 border-t md:border-t-0 md:border-r border-white/[0.08] backdrop-blur-xl bg-[#060810]/95"
    >
      {/* Top / Brand (Desktop only) */}
      <div className="hidden md:flex mb-3">
        <Link to="/" className="hover:scale-105 transition-transform">
          <img src="/logo.png" className="w-8 h-8 opacity-90" alt="Nexora" />
        </Link>
      </div>

      {/* Nav items list */}
      <ul className="flex flex-row md:flex-col items-center justify-around md:justify-start w-full md:w-auto md:space-y-1.5">
        {navItem("/", <RiImageCircleAiLine size={19} />, "Generate Image")}
        {navItem("/public_repositories", <RiGitRepositoryLine size={19} />, "Public Repositories")}
        {!!isLoggedIn && navItem("/project", <VscGithubProject size={18} />, "Projects")}
        {!!isLoggedIn && navItem("/version_tree", <PiTreeStructure size={18} />, "Version Tree")}
        {!!isLoggedIn && navItem("/notification", <IoIosNotificationsOutline size={20} />, "Notifications")}

        {/* Mobile auth button integrated in bottom row */}
        <li className="md:hidden mt-auto">
          {!isLoggedIn ? (
            <Link
              to="/auth/login"
              className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-white"
            >
              <MdAccountCircle size={20} />
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-400 hover:text-red-400 active:scale-95 cursor-pointer"
            >
              <IoLogOutOutline size={20} />
            </button>
          )}
        </li>
      </ul>

      {/* Desktop bottom auth section */}
      <div className="hidden md:flex flex-col items-center mt-auto">
        {!isLoggedIn ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/auth/login"
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-150"
              >
                <MdAccountCircle size={19} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Login</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 cursor-pointer"
              >
                <IoLogOutOutline size={19} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </nav>
  );
}

export default Sidebar;
