import { ArrowUpRight, FileText } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { money } from "../data/mockData";

export default function RequestTable({ requests, onSelect, showOwner = false }) {
  return <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] text-left">
      <thead><tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
        <th className="px-5 py-3 font-semibold">Proposal</th>{showOwner && <th className="px-4 py-3 font-semibold">Submitted by</th>}
        <th className="px-4 py-3 font-semibold">Amount</th><th className="px-4 py-3 font-semibold">Date</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-5 py-3"></th>
      </tr></thead>
      <tbody className="divide-y divide-slate-100">
        {requests.map((r) => <tr key={r.id} className="transition hover:bg-slate-50/80">
          <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-50 p-2 text-blue-700"><FileText size={17}/></div><div><p className="text-sm font-semibold text-slate-800">{r.title}</p><p className="mt-0.5 text-xs text-slate-400">{r.id} · {r.category}</p></div></div></td>
          {showOwner && <td className="px-4 py-4 text-sm text-slate-600">{r.submittedBy}<p className="text-xs text-slate-400">{r.department}</p></td>}
          <td className="px-4 py-4 text-sm font-semibold text-slate-700">{money(r.amount)}</td>
          <td className="px-4 py-4 text-sm text-slate-500">{r.submitted}</td>
          <td className="px-4 py-4"><StatusBadge status={r.status}/></td>
          <td className="px-5 py-4 text-right"><button onClick={() => onSelect(r)} className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-700" aria-label={`View ${r.id}`}><ArrowUpRight size={17}/></button></td>
        </tr>)}
        {!requests.length && <tr><td colSpan={showOwner ? 6 : 5} className="px-5 py-12 text-center text-sm text-slate-400">No proposals found.</td></tr>}
      </tbody>
    </table>
  </div>;
}
