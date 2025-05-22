import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, HomeIcon, ShipWheelIcon } from "lucide-react";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/notifications", label: "Notifications", icon: BellIcon },
  ];

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      {/* Logo Section */}
      <div className="p-6 border-b border-base-300">
        <Link to="/" className="flex items-center gap-3">
          <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-mono">
            CALLER.IO
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pt-6 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
              currentPath === to
                ? "bg-base-300 text-primary font-semibold"
                : "text-base-content hover:bg-base-300 hover:text-primary"
            }`}
          >
            <Icon className="w-5 h-5 opacity-80" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-5 border-t border-base-300 mt-auto">
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">{authUser?.fullName}</span>
            <span className="text-xs text-success flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-success"></span>
              Online
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
