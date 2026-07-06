import { NavLink, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Users", Icon: Users, end: false },
  { to: "/admin/deposits", label: "Deposits", Icon: ArrowDownToLine, end: false },
  { to: "/admin/withdrawals", label: "Withdrawals", Icon: ArrowUpFromLine, end: false },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/admin/login");
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <Logo />
        </div>
        <div className="admin-badge">
          <ShieldCheck size={13} /> <span>ADMIN</span>
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="app-nav__link"
              style={({ isActive }) => ({
                color: isActive ? "#06121f" : "var(--text)",
                background: isActive ? "var(--gradient)" : "transparent",
              })}
            >
              <item.Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="app-sidebar__footer">
          <div className="muted app-sidebar__email">{user?.email}</div>
          <button
            className="btn-ghost btn app-sidebar__logout"
            style={{ display: "flex", gap: "0.5rem" }}
            onClick={handleLogout}
          >
            <LogOut size={16} /> <span>Log out</span>
          </button>
        </div>
      </aside>
      <main className="app-main">
        <div className="app-content app-content--wide">{children}</div>
      </main>
    </div>
  );
}
