import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Dashboard } from "./pages/Dashboard";
import { Deposit } from "./pages/Deposit";
import { Withdraw } from "./pages/Withdraw";
import { Transactions } from "./pages/Transactions";
import { Referrals } from "./pages/Referrals";
import { AIBot } from "./pages/AIBot";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminDeposits } from "./pages/admin/AdminDeposits";
import { AdminWithdrawals } from "./pages/admin/AdminWithdrawals";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoute>
      <AdminLayout>{children}</AdminLayout>
    </AdminRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* User area */}
      <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
      <Route path="/deposit" element={<Shell><Deposit /></Shell>} />
      <Route path="/withdraw" element={<Shell><Withdraw /></Shell>} />
      <Route path="/bot" element={<Shell><AIBot /></Shell>} />
      <Route path="/transactions" element={<Shell><Transactions /></Shell>} />
      <Route path="/referrals" element={<Shell><Referrals /></Shell>} />

      {/* Admin area (separate login + guard) */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminShell><AdminDashboard /></AdminShell>} />
      <Route path="/admin/users" element={<AdminShell><AdminUsers /></AdminShell>} />
      <Route path="/admin/deposits" element={<AdminShell><AdminDeposits /></AdminShell>} />
      <Route path="/admin/withdrawals" element={<AdminShell><AdminWithdrawals /></AdminShell>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
