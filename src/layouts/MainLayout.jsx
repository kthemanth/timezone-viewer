import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "text-sm font-medium px-3 py-2 rounded-xl transition-colors",
          isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
        ].join(" ")
      }
      end
    >
      {children}
    </NavLink>
  );
}

export default function MainLayout() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();

  const isFullBleed = pathname.startsWith("/day") || pathname.startsWith("/test");
  const shellClass = isFullBleed ? "w-full max-w-none" : "w-full max-w-5xl";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden flex flex-col">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className={`mx-auto ${shellClass} flex items-center justify-between px-4 py-3`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-slate-900" />
            <span className="font-semibold">Quinn's Calendar</span>
          </div>

          <nav className="flex items-center gap-2">
            <NavItem to="/">Month</NavItem>
            <NavItem to="/day">Today</NavItem>
            <NavItem to="/cat">Tigrou</NavItem>
            <button
              type="button"
              onClick={signOut}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              title={user?.email ?? "Sign out"}
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className={`mx-auto ${shellClass} flex-1 px-4 py-6`}>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className={`mx-auto ${shellClass} px-4 py-6 text-sm text-slate-500`}>
          © {new Date().getFullYear()} Quinn's Calendar
        </div>
      </footer>
    </div>
  );
}
