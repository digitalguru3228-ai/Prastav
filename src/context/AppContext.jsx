import { createContext, useContext, useMemo, useState } from "react";
import { initialRequests } from "../data/mockData";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Requests are still sample data in this authentication-ready build.
  // They will be replaced with Supabase proposal queries in the next integration step.
  const [requests, setRequests] = useState(initialRequests);
  const { profile } = useAuth();

  const currentUser = useMemo(() => profile ? ({
    id: profile.id,
    name: profile.full_name || profile.email || "Prastav User",
    email: profile.email,
    role: profile.role,
    department: profile.department || "Not assigned",
  }) : null, [profile]);

  const value = useMemo(() => ({
    requests,
    setRequests,
    currentUser,
    addRequest: (request) => setRequests((prev) => [request, ...prev]),
    updateRequest: (id, patch) => setRequests((prev) => prev.map((r) => r.id === id ? { ...r, ...patch } : r)),
  }), [requests, currentUser]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
