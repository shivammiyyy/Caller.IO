import { useState } from "react";
import { PhoneCall } from "lucide-react";
import { Link } from "react-router";
import useLogin from "../hooks/useLogin";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="border border-gray-300 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        {/* FORM SECTION */}
        <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center">
          {/* Logo */}
          <div className="mb-6 flex items-center gap-2">
            <PhoneCall className="w-8 h-8 text-indigo-600" />
            <span className="text-3xl font-bold font-mono tracking-wide text-gray-800">
              CALLER.IO
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded mb-4 text-sm">
              {error.response?.data?.message || "Something went wrong"}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Welcome Back</h2>
              <p className="text-sm text-gray-500">
                Sign in to continue your language journey
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="hello@example.com"
                  className="input input-bordered w-full border-gray-300"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full border-gray-300"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

              <p className="text-sm text-center text-gray-600">
                Don't have an account?{" "}
                <Link to="/signup" className="text-indigo-600 hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* IMAGE / RIGHT SECTION */}
        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            {/* Illustration */}
            <div className="relative aspect-square max-w-sm mx-auto">
              <img src="/i.png" alt="Language connection illustration" className="w-full h-full" />
            </div>

            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">Connect with language partners worldwide</h2>
              <p className="opacity-70">
                Practice conversations, make friends, and improve your language skills together
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
