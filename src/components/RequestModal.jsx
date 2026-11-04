import { useEffect, useState } from "react";
import { X, UploadCloud, Save, Send } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function RequestModal({ onClose, onSaveDraft, onSubmit }) {
  const { categories, loading: appLoading } = useApp();
  const [form, setForm] = useState({
    title: "", categoryId: "", amount: "", description: "",
  });
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!form.categoryId && categories.length) {
      setForm((current) => ({ ...current, categoryId: categories[0].id }));
    }
  }, [categories, form.categoryId]);

  const change = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.title.trim()) return "Please enter a proposal title.";
    if (!form.categoryId) return "Please select a request category.";
    if (!form.amount || !Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
      return "Please enter a valid amount greater than zero.";
    }
    if (!form.description.trim()) return "Please enter the business justification.";
    return "";
  };

  const save = async (submitAfterSave) => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError("");
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        fileName,
      };
      if (submitAfterSave) {
        await onSubmit(payload);
      } else {
        await onSaveDraft(payload);
      }
    } catch (err) {
      setError(err.message || "Unable to save this proposal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Create new proposal</h2>
            <p className="mt-1 text-sm text-slate-500">Save a draft or submit it into the approval workflow.</p>
          </div>
          <button type="button" disabled={busy} onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X size={19}/>
          </button>
        </div>

        <form onSubmit={(event) => event.preventDefault()} className="space-y-4 p-6">
          <div>
            <label className="field-label" htmlFor="proposal-title">Proposal title *</label>
            <input id="proposal-title" name="title" value={form.title} onChange={change} className="field" placeholder="e.g. Workstation upgrade" disabled={busy}/>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="proposal-category">Category *</label>
              <select id="proposal-category" name="categoryId" value={form.categoryId} onChange={change} className="field" disabled={busy || appLoading}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {!appLoading && categories.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">No active categories are configured. Ask the administrator to add one.</p>
              )}
            </div>
            <div>
              <label className="field-label" htmlFor="proposal-amount">Requested amount (₹) *</label>
              <input id="proposal-amount" name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={change} className="field" placeholder="75000" disabled={busy}/>
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="proposal-description">Business justification *</label>
            <textarea id="proposal-description" name="description" rows="4" value={form.description} onChange={change} className="field resize-none" placeholder="Explain the purpose, expected outcome and business need..." disabled={busy}/>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 hover:border-blue-400">
            <UploadCloud className="text-blue-700" size={21}/>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-700">Supporting document</span>
              <span className="block truncate text-xs text-slate-400">{fileName || "Choose a file (upload integration is not enabled yet)"}</span>
            </span>
            <input type="file" className="hidden" disabled={busy} onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}/>
          </label>

          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={busy} className="btn-secondary">Cancel</button>
            <button type="button" onClick={() => save(false)} disabled={busy || appLoading || !categories.length} className="btn-secondary">
              <Save size={16}/>{busy ? "Saving..." : "Save draft"}
            </button>
            <button type="button" onClick={() => save(true)} disabled={busy || appLoading || !categories.length} className="btn-primary">
              <Send size={16}/>{busy ? "Processing..." : "Submit proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
