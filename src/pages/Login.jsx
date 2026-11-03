import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck } from "lucide-react";
import Brand from "../components/Brand";
import { useAuth } from "../context/AuthContext";
import { getHomeForRole } from "../components/ProtectedRoute";

export default function Login() {
  const { signIn, isAuthenticated, loading, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && isAuthenticated && profile) {
    return <Navigate to={getHomeForRole(profile.role)} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await signIn({ email, password });
      // The auth listener loads the profile. The protected route handles loading and role checks.
      if (data.session) navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-10">
      <div className="w-full max-w-[460px]">
        <div className="mb-7 flex justify-center"><Brand /></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><LogIn size={23} /></div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500">Sign in to your Prastav workspace.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label" htmlFor="login-email">Email address</label><input id="login-email" className="field" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /></div>
            <div><label className="field-label" htmlFor="login-password">Password</label><input id="login-password" className="field" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /></div>
            {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Signing in..." : "Sign in"}</button>
          </form>
          <div className="mt-6 flex items-start gap-2 rounded-xl bg-blue-50 p-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-700" /><p className="text-xs leading-5 text-blue-800">Your workspace is selected from the role assigned to your account. New registrations are employee accounts.</p></div>
          <p className="mt-6 text-center text-sm text-slate-500">New to Prastav? <Link className="font-semibold text-blue-700 hover:text-blue-900" to="/register">Create an account</Link></p>
          <p className="mt-6 text-center text-xs text-slate-400">© 2026 Prastav · Transforming Proposals into Decisions.</p>
        </div>
      </div>
    </div>
  );
}
