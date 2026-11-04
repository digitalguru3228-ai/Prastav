
import {
  X,
  CheckCircle2,
  Circle,
  Clock3,
  XCircle,
  FileText,
  MessageSquare,
} from "lucide-react";

import StatusBadge from "./StatusBadge";
import { money } from "../data/mockData";

export default function RequestDetails({
  request,
  onClose,
  actions = false,
  onDecision,
  onSendBack,
  busy = false,
  canSubmitDraft = false,
  onSubmitDraft,
}) {
  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]"
      onMouseDown={(e) =>
        e.target === e.currentTarget && onClose()
      }
    >
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
              {request.id}
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Proposal details
            </h2>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Proposal information */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status} />

              <span className="text-xs text-slate-400">
                {request.submitted}
              </span>
            </div>

            <h3 className="mt-3 text-2xl font-bold text-slate-900">
              {request.title}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {request.category} · {request.department}
            </p>
          </div>

          {/* Amount and submitter */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Requested amount
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {money(request.amount)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">
                Submitted by
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                {request.submittedBy}
              </p>
            </div>
          </div>

          {/* Justification */}
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Justification
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {request.description}
            </p>
          </div>

          {/* Attachment */}
          {request.fileName && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
              <FileText className="text-blue-700" />

              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {request.fileName}
                </p>

                <p className="text-xs text-slate-400">
                  Demo attachment reference
                </p>
              </div>
            </div>
          )}

          {/* Approval timeline */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-slate-800">
              Approval timeline
            </h4>

            <div className="space-y-0">
              {(request.approvals || []).map((a, i) => (
                <div
                  key={a.id || i}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {i !== request.approvals.length - 1 && (
                    <span className="absolute left-[11px] top-6 h-full w-px bg-slate-200" />
                  )}

                  {/* Status icon */}
                  <div className="z-[1] rounded-full bg-white">
                    {a.status === "Approved" ? (
                      <CheckCircle2 className="text-emerald-600" />
                    ) : a.status === "Rejected" ? (
                      <XCircle className="text-rose-600" />
                    ) : a.status === "Pending" ? (
                      <Clock3 className="text-amber-500" />
                    ) : a.status === "Sent back" ? (
                      <XCircle className="text-amber-600" />
                    ) : (
                      <Circle className="text-slate-300" />
                    )}
                  </div>

                  {/* Approver details and comment */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {a.role}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {a.name}
                    </p>

                    {a.date && (
                      <p className="mt-1 text-[11px] text-slate-400">
                        {a.date}
                      </p>
                    )}

                    {/* NEW: Display approver comment */}
                    {a.comment && (
                      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-800">
                          <MessageSquare size={14} />
                          Approver's Comment
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                          {a.comment}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step status */}
                  <span className="shrink-0 text-xs text-slate-400">
                    {a.status}
                  </span>
                </div>
              ))}

              {(!request.approvals || request.approvals.length === 0) && (
                <p className="text-sm text-slate-400">
                  No approval steps available yet.
                </p>
              )}
            </div>
          </div>

          {/* Rejection reason */}
          {request.rejectionReason && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-800">
                Reason for rejection
              </p>

              <p className="mt-1 text-sm text-rose-700">
                {request.rejectionReason}
              </p>
            </div>
          )}

          {/* Submit saved draft */}
          {canSubmitDraft && request.status === "Draft" && (
            <div className="border-t border-slate-100 pt-5">
              <p className="mb-3 text-sm text-slate-600">
                This proposal is saved as a draft and has not entered
                the approval workflow.
              </p>

              <button
                disabled={busy}
                onClick={() => onSubmitDraft?.(request.id)}
                className="btn-primary w-full"
              >
                Submit saved proposal
              </button>
            </div>
          )}

          {/* Approver actions */}
          {actions &&
            request.status !== "Approved" &&
            request.status !== "Rejected" && (
              <div className="border-t border-slate-100 pt-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <MessageSquare size={16} />
                  Review decision
                </p>

                <textarea
                  id="review-comment"
                  rows="3"
                  className="field resize-none"
                  placeholder="Add a comment or reason..."
                />

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    disabled={busy}
                    onClick={() =>
                      onDecision?.(
                        "Rejected",
                        document.getElementById("review-comment")?.value
                      )
                    }
                    className="btn-danger"
                  >
                    Reject
                  </button>

                  <button
                    disabled={busy}
                    onClick={() =>
                      onSendBack?.(
                        document.getElementById("review-comment")?.value
                      )
                    }
                    className="btn-secondary"
                  >
                    Send back
                  </button>

                  <button
                    disabled={busy}
                    onClick={() =>
                      onDecision?.(
                        "Approved",
                        document.getElementById("review-comment")?.value
                      )
                    }
                    className="btn-primary"
                  >
                    Approve
                  </button>
                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  Your decision is validated and recorded by the approval
                  workflow.
                </p>
              </div>
            )}
        </div>
      </aside>
    </div>
  );
}
