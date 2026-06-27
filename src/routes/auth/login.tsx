import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import AuthLayout from "@/lib/layouts/AuthLayout";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { IoMdArrowRoundBack } from "react-icons/io";

export const Route = createFileRoute("/auth/login")({
  beforeLoad: () => {
    const token = useAuthStore.getState().token;

    if (token) {
      throw redirect({
        to: "/",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate, isPending, error } = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      toast.success("Event has been created");
      navigate({
        to: "/",
      });
    },
    onError: (res) => {
      console.log("res", res);
      toast.error((error as Error).message || "Login Failed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate({
      email,
      password,
    });
  };

  return (
    <AuthLayout>
      <Link to="/">
        <Button
          variant="back_button"
          className="fixed top-2 left-2 flex items-center gap-x-2"
        >
          <IoMdArrowRoundBack size={20} />
          Go Back
        </Button>
      </Link>
      <div className="flex flex-col justify-center px-6 py-12 lg:px-8 border rounded-2xl w-full sm:max-w-xl">
        <div className="sm:mx-auto">
          <img alt="logo" src="/logo.png" className="mx-auto w-1/2" />
        </div>

        <div className="mt-10 w-full">
          <form onSubmit={handleSubmit} className="space-y-6 mb-2 text-start">
            <div>
              <label
                htmlFor="email"
                className="block text-xl font-medium text-gray-100"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-xl"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xl font-medium text-gray-100"
                >
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{}</p>}
            <div>
              <button
                type="submit"
                disabled={isPending}
                onClick={() => toast.success("Event has been created")}
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-3 cursor-pointer font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {isPending ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-md text-gray-400">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate({ to: "/auth/signup" })}
              className="font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Create an account
            </span>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
