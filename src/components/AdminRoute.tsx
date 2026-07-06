import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** Guards the admin area: requires an authenticated admin, else sends to /admin/login. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: "2rem" }} className="muted">Loading…</div>;
  }
  if (!user || !user.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
}
