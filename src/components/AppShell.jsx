import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, FlaskConical, FileText, User } from "lucide-react";

const NAV = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Appts", icon: Calendar, path: "/appointments" },
  { label: "Labs", icon: FlaskConical, path: "/lab-reports" },
  { label: "Records", icon: FileText, path: "/records" },
  { label: "Profile", icon: User, path: "/profile" },
];

export default function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    /* Outer centering wrapper — gives the "phone frame" feel on desktop */
    <div className="min-h-screen bg-gray-100 flex justify-center items-start">
      <div className="w-full max-w-md bg-white min-h-screen relative flex flex-col shadow-2xl sm:min-h-screen">
        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
          <Outlet />
        </div>

        {/* Bottom navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 flex justify-around py-2 px-1 z-50 safe-bottom">
          {NAV.map(({ label, icon: Icon, path }) => {
            const active =
              path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(path);
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                  active
                    ? "text-teal-600"
                    : "text-gray-400 hover:text-teal-500"
                }`}
                aria-label={label}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? "fill-teal-50" : ""}
                />
                <span className={`text-[10px] font-semibold ${active ? "text-teal-600" : ""}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
