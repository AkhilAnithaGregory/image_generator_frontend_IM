import { createRootRoute, Outlet } from "@tanstack/react-router";
import Sidebar from "@/components/common/sidebar";
import "./__root.css";

const RootLayout = () => (
  <div className="flex h-full">
    <Sidebar />
    <div className="pl-16 flex-1 h-full">
      <Outlet />
    </div>
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
