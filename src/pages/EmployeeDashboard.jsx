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
import { uploadProposalDocument } from "../utils/proposalDocuments";

export default function EmployeeDashboard({ page = "overview" }) {
  const { requests, currentUser, loading, error, createDraft, submitRequest, refreshRequests } = useApp();
  const [showModal, setShowModal] = useState(page === "new");
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [actionError, setActionError] = useState("");
  const navigate = useNavigate();

  const mine = useMemo(
    () => requests.filter((request) => request.requesterId === currentUser?.id),
    [requests, currentUser?.id]
  );

  const filtered = mine.filter((request) =>
    `${request.title} ${request.id} ${request.status}`.toLowerCase().includes(query.toLowerCase())
  );

  const pending = mine.filter((request) =>
    ["Submitted", "In review", "Revision required"].includes(request.status)
  ).length;
  const approved = mine.filter((request) => request.status === "Approved").length;

  const saveDraft = async (data) => {
    const { file, ...draftData } = data;
    const requestId = await createDraft(draftData);
    if (!requestId) {
      throw new Error("Draft was saved, but the database did not return its ID.");
    }

    if (file) {
      await uploadProposalDocument(requestId, file);
    }

    setShowModal(false);
    await refreshRequests();
    navigate("/employee/proposals");
  };

  const createAndSubmit = async (data) => {
    const { file, ...draftData } = data;
    const requestId = await createDraft(draftData);
    if (!requestId) {
      throw new Error("Draft was saved, but the database did not return its ID. Refresh your proposals before submitting.");
    }

    // A document, when selected, is uploaded and OCR is saved before
    // the proposal enters the existing approval workflow.
    if (file) {
      await uploadProposalDocument(requestId, file);
    }

    await submitRequest(requestId);
    setShowModal(false);
    await refreshRequests();
    navigate("/employee/proposals");
  };

  const submitSavedDraft = async (requestId) => {
    setActionError("");
    try {
      await submitRequest(requestId);
      await refreshRequests();
      setSelected(null);
    } catch (err) {
      setActionError(err.message || "Unable to submit this saved draft.");
    }
  };

  return (
    <DashboardLayout role="employee">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString("en-IN", { dateStyle: "full" })}</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Good day, {(currentUser?.name || "Employee").split(" ")[0]} <span>👋</span>
          </h2>
          <p className="mt-1 text-sm text-slate-500">Here's an overview of your proposals and their progress.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={17}/> New proposal</button>
      </div>

      {(error || actionError) && (
        <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {actionError || error}
          <button className="ml-2 font-semibold underline" onClick={() => setActionError("")}>Dismiss</button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total proposals" value={mine.length} note="Your proposals" icon={FileText}/>
        <StatCard label="Awaiting decision" value={pending} note="Currently in workflow" icon={Clock3} tone="amber"/>
        <StatCard label="Approved" value={approved} note="Successfully completed" icon={CheckCircle2} tone="green"/>
        <StatCard label="Total requested" value={money(mine.reduce((sum, request) => sum + request.amount, 0))} note="Across your proposals" icon={Wallet} tone="violet"/>
      </div>

      {loading ? (
        <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">Loading your proposals...</div>
      ) : (
        <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_0.85fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div><h3 className="font-bold text-slate-800">Recent proposals</h3><p className="mt-1 text-xs text-slate-400">Keep track of your latest submissions and drafts</p></div>
              <button onClick={() => navigate("/employee/proposals")} className="flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900">View all <ArrowRight size={14}/></button>
            </div>
            <RequestTable requests={mine.slice(0, 4)} onSelect={setSelected}/>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><Sparkles size={17}/></div><h3 className="font-bold text-slate-800">Approval at a glance</h3></div>
            <p className="mt-1 text-xs text-slate-400">Your current workflow progress</p>
            <div className="mt-6 space-y-5">
              {mine.filter((request) => ["Submitted", "In review"].includes(request.status)).slice(0, 3).map((request) => {
                const completed = request.approvals.filter((step) => step.status === "Approved").length;
                const total = request.approvals.length || 1;
                return <div key={request.id}>
                  <div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold text-slate-700">{request.title}</p><span className="shrink-0 text-xs text-slate-400">{request.stage}</span></div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(5, (completed / total) * 100)}%` }}/></div>
                </div>;
              })}
              {!mine.some((request) => ["Submitted", "In review"].includes(request.status)) && <p className="text-sm text-slate-400">No proposals currently awaiting a decision.</p>}
            </div>
            <div className="mt-6 rounded-xl bg-blue-50 p-4"><p className="text-xs font-bold text-blue-900">Need to submit a proposal?</p><p className="mt-1 text-xs leading-5 text-blue-800/70">Save a draft or submit a proposal to start its configured approval process.</p><button onClick={() => setShowModal(true)} className="mt-3 text-xs font-bold text-blue-800">Create proposal →</button></div>
          </section>
        </div>
      )}

      {page === "proposals" && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold text-slate-800">All my proposals</h3><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search proposals..." className="field max-w-xs"/></div>
          <RequestTable requests={filtered} onSelect={setSelected}/>
        </section>
      )}

      {showModal && <RequestModal onClose={() => { setShowModal(false); if (page === "new") navigate("/employee"); }} onSaveDraft={saveDraft} onSubmit={createAndSubmit}/>}
      {selected && <RequestDetails request={requests.find((request) => request.id === selected.id) || selected} onClose={() => setSelected(null)} canSubmitDraft onSubmitDraft={submitSavedDraft}/>}
    </DashboardLayout>
  );
}
