const styles = {
  Draft: "bg-slate-100 text-slate-600 ring-slate-200",
  Submitted: "bg-blue-50 text-blue-700 ring-blue-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  "In review": "bg-blue-50 text-blue-700 ring-blue-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  "Revision required": "bg-orange-50 text-orange-700 ring-orange-200",
  "Needs changes": "bg-orange-50 text-orange-700 ring-orange-200",
  Cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
};
export default function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status] || "bg-slate-100 text-slate-600 ring-slate-200"}`}>{status}</span>;
}
