import { Link } from "@tanstack/react-router";
import { RiImageCircleAiLine } from "react-icons/ri";
import { PiTreeStructure } from "react-icons/pi";
import { IoSettingsOutline } from "react-icons/io5";
import { VscGithubProject } from "react-icons/vsc";
import { IoIosNotificationsOutline } from "react-icons/io";
import { RiGitRepositoryLine } from "react-icons/ri";
import { MdAccountCircle } from "react-icons/md";
import { useAuthStore } from "@/lib/store/authStore";

function Sidebar() {
  const { user, token } = useAuthStore();
  const isLoggedIn = !!token && !!user;
  return (
    <div className="min-w-16 w-16 h-screen flex flex-col justify-between text-white p-1 bg-black fixed left-0 top-0 bottom-0 z-10">
      <ul className="space-y-8 mt-5">
        <li className="flex flex-col items-center">
          <img src="/logo.png" className="w-10" alt="logo" />
        </li>
        <Link to="/" className="flex flex-col items-center">
          <RiImageCircleAiLine size={20} />
        </Link>
        {!!isLoggedIn && (
          <Link to="/version_tree" className="flex flex-col items-center">
            <PiTreeStructure size={20} />
          </Link>
        )}
        {!!isLoggedIn && (
          <Link to="/project" className="flex flex-col items-center">
            <VscGithubProject size={20} />
          </Link>
        )}
        <Link to="/public_repositories" className="flex flex-col items-center">
          <RiGitRepositoryLine size={20} />
        </Link>
        {!!isLoggedIn && (
          <Link to="/notification" className="flex flex-col items-center">
            <IoIosNotificationsOutline size={20} />
          </Link>
        )}
        {!!isLoggedIn && (
          <Link to="/settings" className="flex flex-col items-center">
            <IoSettingsOutline size={20} />
          </Link>
        )}
      </ul>
      <div className="p-4">
        <Link to="/auth/login" className="flex flex-col items-center">
          <MdAccountCircle size={20} />
        </Link>
      </div>
    </div>
  );
}

export default Sidebar;
