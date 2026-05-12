import { createRootRoute, Outlet } from "@tanstack/react-router";
import Sidebar from "@/components/common/sidebar";
import App from "../../app";
import "./__root.css";

const RootLayout = () => (
  <div className="flex">
    <Sidebar />
    {/* <App /> */}
    <div className="pl-24">
      <Outlet />
    </div>
  </div>
);

export const Route = createRootRoute({ component: RootLayout });
