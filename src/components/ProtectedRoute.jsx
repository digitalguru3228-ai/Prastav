import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const homeByRole = {
  employee: "/employee",
  approver: "/approver",
  admin: "/admin",
};

export function getHomeForRole(role) {
  return homeByRole[role] || "/login";
}

export default function ProtectedRoute({ allowedRoles, children }) {
  const { loading, isAuthenticated, profile, profileError } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-sm text-slate-600">Loading your secure workspace...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-5">
        <div className="max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Profile setup incomplete</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">{profileError || "Your user profile could not be loaded."}</p>
          <p className="mt-3 text-xs text-slate-500">Ask the project administrator to verify the Supabase profiles table, row-level security policy and new-user trigger.</p>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return <Navigate to={getHomeForRole(profile.role)} replace />;
  }

  return children;
}
