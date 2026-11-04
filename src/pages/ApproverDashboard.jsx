import { useMemo, useState } from "react";
import { ClipboardCheck, Clock3, CheckCircle2, XCircle, Filter } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import RequestTable from "../components/RequestTable";
import RequestDetails from "../components/RequestDetails";
import { useApp } from "../context/AppContext";

export default function ApproverDashboard({ page = "overview" }) {
  const {
    requests, currentUser, loading, error,
    decideApprovalStep, sendBackForRevision, refreshRequests,
  } = useApp();

  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("All");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);

  // A request appears in this approver's workspace only when a pending step
  // is assigned to the currently authenticated user.
  const assigned = useMemo(
    () => requests.filter((request) => request.hasAssignedStep),
    [requests]
  );

  const pending = assigned.filter((request) =>
    request.assignedStepId && ["Submitted", "In review"].includes(request.status)
  );

  const visible = useMemo(() => assigned.filter((request) =>
    filter === "All" || request.status === filter
  ), [assigned, filter]);

  const decide = async (decision, comment) => {
    if (!selected?.assignedStepId) {
      setActionError("This proposal has no pending approval step assigned to your account.");
      return;
    }
    if (decision === "Rejected" && (!comment || comment.trim().length < 3)) {
      setActionError("Please provide a rejection reason of at least 3 characters.");
      return;
    }

    setBusy(true);
    setActionError("");
    try {
      await decideApprovalStep(selected.assignedStepId, decision, comment);
      await refreshRequests();
      setSelected(null);
    } catch (err) {
      setActionError(err.message || "Unable to record this decision.");
    } finally {
      setBusy(false);
    }
  };

  const sendBack = async (comment) => {
    if (!selected?.assignedStepId) return;
    if (!comment || comment.trim().length < 3) {
      setActionError("Please provide a revision comment of at least 3 characters.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      await sendBackForRevision(selected.assignedStepId, comment);
      await refreshRequests();
      setSelected(null);
    } catch (err) {
      setActionError(err.message || "Unable to send this proposal back.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <DashboardLayout role="approver">
      <div className="mb-7">
        <p className="text-sm text-slate-500">{new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Good day, {(currentUser?.name || "Approver").split(" ")[0]} <span>👋</span></h2>
        <p className="mt-1 text-sm text-slate-500">Review proposals assigned to your approval authority.</p>
      </div>

      {(error || actionError) && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError || error}
          <button className="ml-2 font-semibold underline" onClick={() => setActionError("")}>Dismiss</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Assigned proposals" value={assigned.length} note="Assigned to your account" icon={ClipboardCheck}/>
        <StatCard label="Awaiting review" value={pending.length} note="Require your attention" icon={Clock3} tone="amber"/>
        <StatCard label="Approved" value={assigned.filter((request) => request.approvals.some((step) => step.assignedApproverId === currentUser?.id && step.status === "Approved")).length} note="Your completed decisions" icon={CheckCircle2} tone="green"/>
        <StatCard label="Rejected" value={assigned.filter((request) => request.approvals.some((step) => step.assignedApproverId === currentUser?.id && step.status === "Rejected")).length} note="Your rejected decisions" icon={XCircle} tone="rose"/>
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div><h3 className="font-bold text-slate-800">Requests requiring attention</h3><p className="mt-1 text-xs text-slate-400">Only requests assigned to you are shown</p></div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{pending.length} pending</span>
          </div>
          {loading ? <p className="p-8 text-center text-sm text-slate-500">Loading assigned proposals...</p> : <RequestTable requests={pending} showOwner onSelect={setSelected}/>}
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-800">Review checklist</h3><p className="mt-1 text-xs text-slate-400">A consistent review process</p>
          <div className="mt-5 space-y-4">{["Check proposal purpose and scope","Verify requested amount","Review supporting documents","Add a decision comment when required","Record your approval or rejection"].map((item, index) => <div key={item} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{index + 1}</span><p className="pt-1 text-sm text-slate-600">{item}</p></div>)}</div>
          <div className="mt-6 rounded-xl bg-amber-50 p-4"><p className="text-xs font-bold text-amber-900">Pending decisions</p><p className="mt-1 text-xs leading-5 text-amber-800/80">Decisions are recorded through the secure database workflow and audit history.</p></div>
        </section>
      </div>

      {page !== "overview" && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <h3 className="font-bold text-slate-800">{page === "pending" ? "Pending reviews" : "All assigned proposals"}</h3>
            <div className="flex items-center gap-2"><Filter size={15} className="text-slate-400"/><select value={filter} onChange={(event) => setFilter(event.target.value)} className="field !w-auto !py-2 text-xs"><option>All</option><option>Submitted</option><option>In review</option><option>Approved</option><option>Rejected</option></select></div>
          </div>
          <RequestTable requests={page === "pending" ? visible.filter((request) => request.assignedStepId && ["Submitted", "In review"].includes(request.status)) : visible} showOwner onSelect={setSelected}/>
        </section>
      )}

      {selected && (
        <RequestDetails
          request={requests.find((request) => request.id === selected.id) || selected}
          onClose={() => setSelected(null)}
          actions
          onDecision={decide}
          onSendBack={sendBack}
          busy={busy}
        />
      )}
    </DashboardLayout>
  );
}
