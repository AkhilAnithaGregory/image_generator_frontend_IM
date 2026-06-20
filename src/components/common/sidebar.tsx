import { Link } from "@tanstack/react-router";
import { RiAiGenerate2 } from "react-icons/ri";
import { RiImageCircleAiLine } from "react-icons/ri";
import { PiTreeStructure } from "react-icons/pi";
import { IoSettingsOutline } from "react-icons/io5";
import { VscGithubProject } from "react-icons/vsc";
import { IoIosNotificationsOutline } from "react-icons/io";
import { RiGitRepositoryLine } from "react-icons/ri";

function Sidebar() {
  return (
    <div className="min-w-16 w-16 h-screen text-white p-1 bg-black fixed left-0 top-0 bottom-0 z-10">
      <ul className="space-y-8 mt-5">
        <li className="flex flex-col items-center">
          <RiAiGenerate2 size={20} />
        </li>
        <Link to="/" className="flex flex-col items-center">
          <RiImageCircleAiLine size={20} />
        </Link>
        <Link to="/version_tree" className="flex flex-col items-center">
          <PiTreeStructure size={20} />
        </Link>
        <Link to="/project" className="flex flex-col items-center">
          <VscGithubProject size={20} />
        </Link>
        <Link to="/public_repositories" className="flex flex-col items-center">
          <RiGitRepositoryLine size={20} />
        </Link>
        <Link to="/notification" className="flex flex-col items-center">
          <IoIosNotificationsOutline size={20} />
        </Link>
        <Link to="/settings" className="flex flex-col items-center">
          <IoSettingsOutline size={20} />
        </Link>
      </ul>
    </div>
  );
}

export default Sidebar;
