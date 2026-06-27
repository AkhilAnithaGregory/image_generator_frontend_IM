import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import AuthLayout from "@/lib/layouts/AuthLayout";
import { signup } from "@/lib/api";
import { useAuthStore } from "@/lib/store/authStore";
import { Button } from "@/components/ui/button";
import { IoMdArrowRoundBack } from "react-icons/io";

export const Route = createFileRoute("/auth/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutate, isPending, error } = useMutation({
    mutationFn: signup,
    onSuccess: (data) => {
      setAuth(data.user, data.token);
      navigate({
        to: "/auth/login",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutate({
      username,
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
          <span className="mt-10 text-center font-bold tracking-tight text-white">
            Register your account!
          </span>
        </div>

        <div className="mt-10 w-full">
          <form onSubmit={handleSubmit} className="space-y-6 mb-2 text-start">
            <div>
              <label
                htmlFor="username"
                 className="block text-xl font-medium text-gray-100"
              >
                Username
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-xl"
                />
              </div>
            </div>

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
                  className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-sm text-white outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-xl"
                />
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-sm">{(error as Error).message}</p>
            )}
            <div>
              <button
                type="submit"
                disabled={isPending}
                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-3 cursor-pointer font-semibold text-white hover:bg-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
              >
                {isPending ? "Creating account..." : "Sign up"}
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-md text-gray-400">
            Already have an account?{" "}
            <span
              onClick={() => navigate({ to: "/auth/login" })}
              className="font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}