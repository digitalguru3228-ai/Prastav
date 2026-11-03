import { useState } from "react";
import { X, UploadCloud } from "lucide-react";

export default function RequestModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ title: "", category: "IT & Equipment", amount: "", description: "" });
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0 || !form.description.trim()) {
      setError("Please complete all required fields with a valid amount."); return;
    }
    onSubmit({ ...form, amount: Number(form.amount), fileName });
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><h2 className="text-lg font-bold text-slate-900">Create new proposal</h2><p className="mt-1 text-sm text-slate-500">Share the details for review and approval.</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19}/></button></div>
      <form onSubmit={submit} className="space-y-4 p-6">
        <div><label className="field-label">Proposal title *</label><input name="title" value={form.title} onChange={change} className="field" placeholder="e.g. Workstation upgrade"/></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><label className="field-label">Category *</label><select name="category" value={form.category} onChange={change} className="field"><option>IT & Equipment</option><option>Events & Travel</option><option>Software & Services</option><option>Training</option><option>Operations</option><option>Other</option></select></div><div><label className="field-label">Requested amount (₹) *</label><input name="amount" type="number" min="1" value={form.amount} onChange={change} className="field" placeholder="75000"/></div></div>
        <div><label className="field-label">Business justification *</label><textarea name="description" rows="4" value={form.description} onChange={change} className="field resize-none" placeholder="Explain the purpose, expected outcome and business need..."/></div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 hover:border-blue-400"><UploadCloud className="text-blue-700" size={21}/><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-700">Supporting document</span><span className="block truncate text-xs text-slate-400">{fileName || "Choose a file (demo only; storage integration later)"}</span></span><input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}/></label>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} className="btn-secondary">Cancel</button><button className="btn-primary">Submit proposal</button></div>
      </form>
    </div>
  </div>;
}
