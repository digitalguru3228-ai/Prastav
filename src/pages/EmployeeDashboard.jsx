import { useMemo, useState } from "react";
import { Plus, ArrowRight, Clock3, CheckCircle2, FileText, Wallet, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import RequestTable from "../components/RequestTable";
import RequestModal from "../components/RequestModal";
import RequestDetails from "../components/RequestDetails";
import { useApp } from "../context/AppContext";
import { money } from "../data/mockData";

export default function EmployeeDashboard({ page = "overview" }) {
  const { requests, addRequest, currentUser } = useApp();
  const [showModal, setShowModal] = useState(page === "new");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const mine = useMemo(() => requests.filter(r => r.submittedBy === currentUser.name), [requests, currentUser.name]);
  const filtered = mine.filter(r => `${r.title} ${r.id} ${r.status}`.toLowerCase().includes(query.toLowerCase()));
  const pending = mine.filter(r => ["Pending","In review"].includes(r.status)).length;
  const approved = mine.filter(r => r.status === "Approved").length;
  const create = (data) => {
    const request = { ...data, id: `PRS-2026-${String(149 + requests.length).padStart(4,"0")}`, submittedBy: currentUser.name, department: currentUser.department, submitted: "02 Nov 2026", status: "Pending", stage: "Department Head", priority: "Medium", approvals: [{ role: "Department Head", name: "Pending assignment", status: "Pending" }, { role: "Finance Officer", name: "Pending", status: "Upcoming" }, { role: "Senior Authority", name: "Pending", status: "Upcoming" }] };
    addRequest(request); setShowModal(false); navigate("/employee/proposals");
  };
  return <DashboardLayout role="employee">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-slate-500">Monday, 02 November 2026</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Good evening, {currentUser.name.split(" ")[0]} <span>👋</span></h2><p className="mt-1 text-sm text-slate-500">Here's an overview of your proposals and their progress.</p></div><button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={17}/> New proposal</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total proposals" value={mine.length} note="Submitted by you" icon={FileText}/><StatCard label="Awaiting decision" value={pending} note="Currently in workflow" icon={Clock3} tone="amber"/><StatCard label="Approved" value={approved} note="Successfully completed" icon={CheckCircle2} tone="green"/><StatCard label="Total requested" value={money(mine.reduce((s,r)=>s+r.amount,0))} note="Across your proposals" icon={Wallet} tone="violet"/></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h3 className="font-bold text-slate-800">Recent proposals</h3><p className="mt-1 text-xs text-slate-400">Keep track of your latest submissions</p></div><button onClick={() => navigate("/employee/proposals")} className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">View all <ArrowRight size={14}/></button></div><RequestTable requests={mine.slice(0,4)} onSelect={setSelected}/></section>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Sparkles size={17}/></div><h3 className="font-bold text-slate-800">Approval at a glance</h3></div><p className="mt-1 text-xs text-slate-400">Your current workflow progress</p><div className="mt-6 space-y-5">{mine.filter(r=>r.status==="Pending"||r.status==="In review").slice(0,3).map(r=><div key={r.id}><div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold text-slate-700">{r.title}</p><span className="shrink-0 text-xs text-slate-400">{r.stage}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{width: `${Math.max(12,(r.approvals.filter(a=>a.status==="Approved").length/3)*100)}%`}}/></div></div>)}{!mine.some(r=>r.status==="Pending"||r.status==="In review") && <p className="text-sm text-slate-400">No proposals currently awaiting a decision.</p>}</div><div className="mt-6 rounded-xl bg-blue-50 p-4"><p className="text-xs font-bold text-blue-900">Need to submit a proposal?</p><p className="mt-1 text-xs leading-5 text-blue-800/70">Provide the details and supporting documents to start the approval process.</p><button onClick={()=>setShowModal(true)} className="mt-3 text-xs font-bold text-blue-800">Create proposal →</button></div></section>
    </div>
    {page === "proposals" && <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-slate-800">All my proposals</h3><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search proposals..." className="field max-w-xs"/></div><RequestTable requests={filtered} onSelect={setSelected}/></section>}
    {showModal && <RequestModal onClose={()=>{setShowModal(false); if(page==="new") navigate("/employee");}} onSubmit={create}/>}
    {selected && <RequestDetails request={selected} onClose={()=>setSelected(null)}/>}
  </DashboardLayout>;
}
