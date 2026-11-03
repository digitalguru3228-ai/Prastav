import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { UserPlus, ShieldCheck } from "lucide-react";
import Brand from "../components/Brand";
import { useAuth } from "../context/AuthContext";
import { getHomeForRole } from "../components/ProtectedRoute";

export default function Register() {
  const { signUp, isAuthenticated, loading, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", department: "", password: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!loading && isAuthenticated && profile) return <Navigate to={getHomeForRole(profile.role)} replace />;

  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(""); setSuccess("");
    if (form.fullName.trim().length < 2) return setError("Please enter your full name.");
    if (form.password.length < 8) return setError("Password must contain at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setSubmitting(true);
    try {
      const data = await signUp({ fullName: form.fullName, email: form.email, department: form.department, password: form.password });
      if (data.session) {
        setSuccess("Your account was created. Opening your employee workspace...");
        navigate("/employee", { replace: true });
      } else {
        setSuccess("Registration successful. Check your email for the confirmation link, then sign in.");
        setForm({ fullName: "", email: "", department: "", password: "", confirmPassword: "" });
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-7 flex justify-center"><Brand /></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="mb-7 text-center"><div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><UserPlus size={23} /></div><h1 className="text-2xl font-bold text-slate-900">Create your account</h1><p className="mt-2 text-sm text-slate-500">Register as an employee to access Prastav.</p></div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label" htmlFor="reg-name">Full name</label><input id="reg-name" className="field" type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Enter your full name" autoComplete="name" required /></div>
            <div><label className="field-label" htmlFor="reg-email">Email address</label><input id="reg-email" className="field" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" required /></div>
            <div><label className="field-label" htmlFor="reg-dept">Department <span className="font-normal text-slate-400">(optional)</span></label><input id="reg-dept" className="field" type="text" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Finance, IT, Operations" /></div>
            <div><label className="field-label" htmlFor="reg-password">Password</label><input id="reg-password" className="field" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Minimum 8 characters" autoComplete="new-password" minLength={8} required /></div>
            <div><label className="field-label" htmlFor="reg-confirm">Confirm password</label><input id="reg-confirm" className="field" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter your password" autoComplete="new-password" required /></div>
            {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
            {success && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</div>}
            <button type="submit" disabled={submitting} className="btn-primary w-full !py-3 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Creating account..." : "Create account"}</button>
          </form>
          <div className="mt-6 flex items-start gap-2 rounded-xl bg-blue-50 p-3"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-blue-700" /><p className="text-xs leading-5 text-blue-800">New registrations receive the Employee role. Approver and Admin access must be assigned by an authorized administrator.</p></div>
          <p className="mt-5 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-blue-700 hover:text-blue-900" to="/login">Sign in</Link></p>
          <p className="mt-6 text-center text-xs text-slate-400">© 2026 Prastav · Transforming Proposals into Decisions.</p>
        </div>
      </div>
    </div>
  );
}
