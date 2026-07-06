import { NavLink, useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Users,
  Bot,
  LogOut,
} from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "../auth/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/deposit", label: "Deposit", Icon: ArrowDownToLine },
  { to: "/withdraw", label: "Withdraw", Icon: ArrowUpFromLine },
  { to: "/bot", label: "AI Bot", Icon: Bot },
  { to: "/transactions", label: "Transactions", Icon: Receipt },
  { to: "/referrals", label: "Referrals", Icon: Users },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar__brand">
          <Logo />
        </div>
        <nav className="app-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
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
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
