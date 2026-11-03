import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus2, Files, ClipboardCheck, Users, ChartNoAxesCombined, Bell, Search, Menu, X, ChevronDown, LogOut, ShieldCheck, CircleHelp, History } from "lucide-react";
import Brand from "./Brand";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const navByRole = {
  employee: [{ label: "Overview", to: "/employee", icon: LayoutDashboard }, { label: "My proposals", to: "/employee/proposals", icon: Files }, { label: "New proposal", to: "/employee/new", icon: FilePlus2 }],
  approver: [{ label: "Overview", to: "/approver", icon: LayoutDashboard }, { label: "Pending reviews", to: "/approver/pending", icon: ClipboardCheck }, { label: "All assigned", to: "/approver/assigned", icon: Files }],
  admin: [{ label: "Overview", to: "/admin", icon: LayoutDashboard }, { label: "All proposals", to: "/admin/proposals", icon: Files }, { label: "User management", to: "/admin/users", icon: Users }, { label: "Analytics", to: "/admin/analytics", icon: ChartNoAxesCombined }, { label: "Audit history", to: "/admin/audit", icon: History }],
};
const titles = { employee: "Employee workspace", approver: "Approval workspace", admin: "Administration" };

export default function DashboardLayout({ role, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const { currentUser } = useApp();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = navByRole[role] || navByRole.employee;
  const roleName = role === "approver" ? "Approver" : role[0].toUpperCase() + role.slice(1);
  const displayName = currentUser?.name || "Prastav User";
  const initials = displayName.split(" ").filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    setSignOutError("");
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      setSignOutError(error.message || "Unable to sign out. Please try again.");
    }
  };

  const sidebar = <div className="flex h-full flex-col">
    <div className="border-b border-white/10 px-5 py-5"><Brand light /></div>
    <div className="px-5 pt-6"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-200/60">{titles[role]}</p></div>
    <nav className="mt-3 flex-1 space-y-1 px-3">{nav.map((item) => { const Icon = item.icon; return <NavLink key={item.to} to={item.to} end className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${isActive ? "bg-white text-[#12366d] shadow-lg shadow-blue-950/20" : "text-blue-100/75 hover:bg-white/10 hover:text-white"}`} onClick={() => setMobileOpen(false)}><Icon size={18} />{item.label}</NavLink>; })}</nav>
    <div className="m-3 rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2 text-blue-100"><ShieldCheck size={16} /><span className="text-xs font-semibold">Secure workspace</span></div><p className="mt-1 text-[11px] leading-5 text-blue-100/50">Your access is based on your assigned account role.</p></div>
    <div className="border-t border-white/10 p-4"><button className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-blue-100/70 hover:bg-white/10" onClick={() => alert("Contact your Prastav administrator for support.")}><CircleHelp size={15} /> Help & support</button></div>
  </div>;

  const pageTitle = nav.find((n) => n.to === location.pathname)?.label || titles[role];
  return <div className="min-h-screen bg-[#f5f7fb]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] bg-[#102b59] lg:block">{sidebar}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileOpen(false)} /><aside className="absolute inset-y-0 left-0 w-[280px] bg-[#102b59]">{sidebar}<button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 text-white"><X size={18} /></button></aside></div>}
    <div className="lg:pl-[258px]">
      <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
        <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={20} /></button><div><p className="text-[11px] font-medium text-slate-400">PRASTAV / {roleName.toUpperCase()}</p><h1 className="mt-0.5 text-base font-bold text-slate-800">{pageTitle}</h1></div></div>
        <div className="flex items-center gap-2 sm:gap-4"><div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:flex"><Search size={15} className="text-slate-400" /><input placeholder="Search proposals..." className="w-36 bg-transparent text-xs outline-none placeholder:text-slate-400" /></div><button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" onClick={() => alert("You're all caught up.")}><Bell size={19} /></button>
          <div className="relative"><button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{initials}</div><div className="hidden text-left sm:block"><p className="text-xs font-bold text-slate-800">{displayName}</p><p className="text-[10px] text-slate-400">{roleName}</p></div><ChevronDown size={14} className="hidden text-slate-400 sm:block" /></button>
            {profileOpen && <div className="absolute right-0 top-12 z-40 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><div className="px-3 py-2"><p className="text-xs font-semibold text-slate-800">{displayName}</p><p className="mt-1 break-all text-[11px] text-slate-500">{currentUser?.email}</p></div><div className="my-1 border-t border-slate-100" /><button onClick={handleSignOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"><LogOut size={15} /> Sign out</button>{signOutError && <p role="alert" className="px-3 py-2 text-xs text-rose-600">{signOutError}</p>}</div>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-7">{children}</main>
      <footer className="px-7 pb-6 text-center text-[11px] text-slate-400">© 2026 Prastav · Transforming Proposals into Decisions.</footer>
    </div>
  </div>;
}
