import { NavLink, useNavigate } from "react-router-dom";
import { ReactNode, useState } from "react";
import {
  LayoutDashboard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Receipt,
  Users,
  Bot,
  LogOut,
  Menu,
  X,
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : ""}`}>
      <aside className={`app-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="app-sidebar__top">
          <div className="app-sidebar__brand">
            <Logo />
          </div>
          <button
            type="button"
            className="app-sidebar__toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="app-nav" onClick={closeSidebar}>
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
      {sidebarOpen && <div className="app-sidebar__backdrop" onClick={closeSidebar} />}
      <main className="app-main" onClick={closeSidebar}>
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
