import { useMemo, useState } from "react";
import { ClipboardCheck, Clock3, CheckCircle2, XCircle, Filter, ArrowRight } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import RequestTable from "../components/RequestTable";
import RequestDetails from "../components/RequestDetails";
import StatusBadge from "../components/StatusBadge";
import { useApp } from "../context/AppContext";

export default function ApproverDashboard({ page = "overview" }) {
  const { requests, updateRequest } = useApp();
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const pending = requests.filter(r => ["Pending","In review"].includes(r.status));
  const visible = useMemo(() => requests.filter(r => filter === "All" || r.status === filter), [requests, filter]);
  const decide = (decision, comment) => {
    if (decision === "Rejected") updateRequest(selected.id, { status: "Rejected", stage: "Closed", rejectionReason: comment || "Please review the comments and resubmit." });
    else {
      const approvals = [...(selected.approvals || [])];
      const next = approvals.findIndex(a => a.status === "Pending");
      if (next >= 0) approvals[next] = { ...approvals[next], status: "Approved", name: "Neha Shah", date: "02 Nov 2026" };
      const complete = approvals.every(a => a.status === "Approved");
      const nextStage = approvals.find(a => a.status === "Pending")?.role || "Completed";
      updateRequest(selected.id, { approvals, status: complete ? "Approved" : "In review", stage: nextStage });
    }
    setSelected(null);
  };
  return <DashboardLayout role="approver">
    <div className="mb-7"><p className="text-sm text-slate-500">Monday, 02 November 2026</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Good evening, Neha <span>👋</span></h2><p className="mt-1 text-sm text-slate-500">Review proposals and keep decisions moving.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Assigned proposals" value={requests.length} note="Across your workflow" icon={ClipboardCheck}/><StatCard label="Awaiting review" value={pending.length} note="Require attention" icon={Clock3} tone="amber"/><StatCard label="Approved" value={requests.filter(r=>r.status==="Approved").length} note="Completed proposals" icon={CheckCircle2} tone="green"/><StatCard label="Rejected" value={requests.filter(r=>r.status==="Rejected").length} note="Closed proposals" icon={XCircle} tone="rose"/></div>
    <div className="mt-7 grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h3 className="font-bold text-slate-800">Requests requiring attention</h3><p className="mt-1 text-xs text-slate-400">Select a proposal to review its details</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{pending.length} pending</span></div><RequestTable requests={pending} showOwner onSelect={setSelected}/></section>
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><h3 className="font-bold text-slate-800">Review checklist</h3><p className="mt-1 text-xs text-slate-400">A consistent review process</p><div className="mt-5 space-y-4">{["Check proposal purpose and scope","Verify requested amount","Review supporting documents","Add a decision comment if needed","Record your approval or rejection"].map((x,i)=><div key={x} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{i+1}</span><p className="pt-1 text-sm text-slate-600">{x}</p></div>)}</div><div className="mt-6 rounded-xl bg-amber-50 p-4"><p className="text-xs font-bold text-amber-900">Pending decisions</p><p className="mt-1 text-xs leading-5 text-amber-800/80">Review requests promptly and include clear comments to maintain a transparent audit trail.</p></div></section>
    </div>
    {page !== "overview" && <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5"><h3 className="font-bold text-slate-800">{page === "pending" ? "Pending reviews" : "All assigned proposals"}</h3><div className="flex items-center gap-2"><Filter size={15} className="text-slate-400"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="field !w-auto !py-2 text-xs"><option>All</option><option>Pending</option><option>In review</option><option>Approved</option><option>Rejected</option></select></div></div><RequestTable requests={page === "pending" ? visible.filter(r=>["Pending","In review"].includes(r.status)) : visible} showOwner onSelect={setSelected}/></section>}
    {selected && <RequestDetails request={requests.find(r=>r.id===selected.id) || selected} onClose={()=>setSelected(null)} actions onDecision={decide}/>}
  </DashboardLayout>;
}
