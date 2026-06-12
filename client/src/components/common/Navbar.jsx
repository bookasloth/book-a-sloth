import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur">
      <div className="app-container py-3 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="text-lg sm:text-xl font-bold text-primary hover:no-underline"
        >
          Book A Sloth
        </Link>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-primary"
              >
                Dashboard
              </Link>
              <span className="hidden max-w-[12rem] truncate text-sm text-gray-500 sm:inline">
                Hi, {user.name}
              </span>
              <button
                onClick={logout}
                className="min-h-10 rounded-full bg-gray-100 px-4 py-2 text-sm font-medium hover:bg-gray-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login-as-vendor"
                className="px-2 text-sm font-medium text-gray-600 hover:text-primary"
              >
                Vendor Login
              </Link>
              <Link to="/be-a-sloth" className="fb-btn fb-btn--primary">
                Be a Sloth
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
