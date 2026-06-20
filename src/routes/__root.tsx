import { createRootRoute, Outlet } from "@tanstack/react-router";
import "./__root.css";

const RootLayout = () => <Outlet />;

export const Route = createRootRoute({ component: RootLayout });
