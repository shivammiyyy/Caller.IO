import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const { logoutMutation } = useLogout();

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Left Section - Logo (Only on Chat Page) */}
        {isChatPage ? (
          <Link to="/" className="flex items-center gap-3">
            <ShipWheelIcon className="w-8 h-8 text-primary" />
            <span className="text-2xl font-semibold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              CALLER.IO
            </span>
          </Link>
        ) : (
          <div />
        )}

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <Link to="/notifications" className="relative">
            <button className="btn btn-ghost btn-circle hover:bg-base-300 transition">
              <BellIcon className="w-6 h-6 text-base-content opacity-80" />
            </button>
          </Link>

          {/* Theme Selector */}
          <ThemeSelector />

          {/* User Avatar */}
          <div className="avatar">
            <div className="w-9 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>

          {/* Logout */}
          <button
            className="btn btn-ghost btn-circle hover:bg-base-300 transition"
            onClick={logoutMutation}
          >
            <LogOutIcon className="w-6 h-6 text-base-content opacity-80" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
