import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute, { getHomeForRole } from "./components/ProtectedRoute";
import Register from "./pages/Register";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ApproverDashboard from "./pages/ApproverDashboard";
import AdminDashboard from "./pages/AdminDashboard";

function RootRedirect() {
  const { loading, isAuthenticated, profile } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">Loading Prastav...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace />;
  return <Navigate to={getHomeForRole(profile.role)} replace />;
}

function AppRoutes() {
  return <Routes>
    <Route path="/" element={<RootRedirect />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route path="/employee" element={<ProtectedRoute allowedRoles={["employee"]}><EmployeeDashboard /></ProtectedRoute>} />
    <Route path="/employee/proposals" element={<ProtectedRoute allowedRoles={["employee"]}><EmployeeDashboard page="proposals" /></ProtectedRoute>} />
    <Route path="/employee/new" element={<ProtectedRoute allowedRoles={["employee"]}><EmployeeDashboard page="new" /></ProtectedRoute>} />

    <Route path="/approver" element={<ProtectedRoute allowedRoles={["approver"]}><ApproverDashboard /></ProtectedRoute>} />
    <Route path="/approver/pending" element={<ProtectedRoute allowedRoles={["approver"]}><ApproverDashboard page="pending" /></ProtectedRoute>} />
    <Route path="/approver/assigned" element={<ProtectedRoute allowedRoles={["approver"]}><ApproverDashboard page="assigned" /></ProtectedRoute>} />

    <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
    <Route path="/admin/proposals" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard page="proposals" /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard page="users" /></ProtectedRoute>} />
    <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard page="analytics" /></ProtectedRoute>} />
    <Route path="/admin/audit" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard page="audit" /></ProtectedRoute>} />

    <Route path="*" element={<RootRedirect />} />
  </Routes>;
}

export default function App() {
  return <AppProvider><AppRoutes /></AppProvider>;
}
