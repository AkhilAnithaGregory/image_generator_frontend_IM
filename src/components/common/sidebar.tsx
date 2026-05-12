import { Link } from "@tanstack/react-router";
import { RiAiGenerate2 } from "react-icons/ri";
import { IoHomeOutline } from "react-icons/io5";
import { RiImageCircleAiLine } from "react-icons/ri";
import { PiTreeStructure } from "react-icons/pi";
import { IoSettingsOutline } from "react-icons/io5";

function Sidebar() {
  return (
    <div className="min-w-24 w-24 h-screen text-white p-1 bg-black fixed left-0 top-0 bottom-0 z-10">
      <h2 className="text-2xl font-bold mb-4 flex justify-center my-4 w-full">
        <RiAiGenerate2 />
      </h2>
      <ul className="space-y-5 mt-5">
        <Link to="/" className="flex flex-col items-center">
          <IoHomeOutline size={20} />
          <span>Home</span>
        </Link>
        <Link to="/generator" className="flex flex-col items-center">
          <RiImageCircleAiLine size={20} />
          <p>
            Image <br /> Generate
          </p>
        </Link>
        <Link to="/version_tree" className="flex flex-col items-center">
          <PiTreeStructure size={20} />
          <span>Version Tree</span>
        </Link>
        <Link to="/settings" className="flex flex-col items-center">
          <IoSettingsOutline size={20} />
          <span>Settings</span>
        </Link>
      </ul>
    </div>
  );
}

export default Sidebar;
