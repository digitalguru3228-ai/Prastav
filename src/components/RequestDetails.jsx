import { useEffect, useState } from "react";
import {
  X, CheckCircle2, Circle, Clock3, XCircle, FileText, MessageSquare,
  Download, LoaderCircle, ScanText,
} from "lucide-react";
import StatusBadge from "./StatusBadge";
import { money } from "../data/mockData";
import { supabase } from "../lib/supabase";

const BUCKET = "prastav-documents";

export default function RequestDetails({
  request, onClose, actions = false, onDecision, onSendBack,
  busy = false, canSubmitDraft = false, onSubmitDraft,
}) {
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const [openingId, setOpeningId] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadDocuments() {
      if (!request?.id) return;
      setDocumentsLoading(true);
      setDocumentError("");
      const { data, error } = await supabase
        .from("request_documents")
        .select("id, file_name, storage_path, mime_type, file_size, extracted_text, ocr_status, created_at")
        .eq("request_id", request.id)
        .order("created_at", { ascending: false });

      if (!active) return;
      if (error) setDocumentError(error.message);
      else setDocuments(data || []);
      setDocumentsLoading(false);
    }
    void loadDocuments();
    return () => { active = false; };
  }, [request?.id]);

  const openDocument = async (documentRow) => {
    setOpeningId(documentRow.id);
    setDocumentError("");
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(documentRow.storage_path, 60);
      if (error) throw error;
      if (!data?.signedUrl) throw new Error("Could not create a secure document link.");
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      setDocumentError(error.message || "Unable to open this document.");
    } finally {
      setOpeningId(null);
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-[2px]" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">{request.id}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Proposal details</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={19}/></button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status}/>
              <span className="text-xs text-slate-400">{request.submitted}</span>
            </div>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">{request.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{request.category} · {request.department}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Requested amount</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{money(request.amount)}</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Submitted by</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{request.submittedBy}</p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-800">Justification</h4>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{request.description}</p>
          </div>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <FileText size={17} className="text-blue-700"/>
              <h4 className="text-sm font-bold text-slate-800">Supporting documents & OCR</h4>
            </div>
            {documentsLoading && <p className="text-sm text-slate-500">Loading documents...</p>}
            {!documentsLoading && documents.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
                No supporting documents have been uploaded for this proposal.
              </p>
            )}
            <div className="space-y-3">
              {documents.map((doc) => (
                <article key={doc.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 shrink-0 text-blue-700"/>
                    <div className="min-w-0 flex-1">
                      <p className="break-all text-sm font-semibold text-slate-800">{doc.file_name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {(doc.file_size / 1024 / 1024).toFixed(2)} MB · {doc.mime_type}
                      </p>
                      <p className={`mt-2 text-xs font-semibold ${doc.ocr_status === "completed" ? "text-emerald-700" : doc.ocr_status === "failed" ? "text-rose-600" : "text-amber-700"}`}>
                        OCR: {doc.ocr_status === "completed" ? "Text extracted" : doc.ocr_status === "failed" ? "Extraction failed" : "Pending"}
                      </p>
                    </div>
                    <button onClick={() => openDocument(doc)} disabled={openingId === doc.id} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                      {openingId === doc.id ? <LoaderCircle size={14} className="animate-spin"/> : <Download size={14}/>}
                      Open
                    </button>
                  </div>
                  {doc.ocr_status === "completed" && (
                    <details className="mt-3 rounded-lg bg-slate-50 p-3">
                      <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-slate-700">
                        <ScanText size={14}/> View extracted text for manual review
                      </summary>
                      <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-600">{doc.extracted_text || "No readable text was detected in this document."}</pre>
                    </details>
                  )}
                  {doc.ocr_status === "failed" && (
                    <p className="mt-3 text-xs leading-5 text-slate-500">The document is stored securely, but OCR could not extract text. The original document can still be opened and reviewed manually.</p>
                  )}
                </article>
              ))}
            </div>
            {documentError && <p role="alert" className="mt-2 text-xs text-rose-600">{documentError}</p>}
          </section>

          <div>
            <h4 className="mb-4 text-sm font-bold text-slate-800">Approval timeline</h4>
            <div className="space-y-0">
              {(request.approvals || []).map((a, i) => (
                <div key={a.id || i} className="relative flex gap-3 pb-5 last:pb-0">
                  {i !== request.approvals.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-slate-200"/>}
                  <div className="z-[1] rounded-full bg-white">
                    {a.status === "Approved" ? <CheckCircle2 className="text-emerald-600"/> :
                     a.status === "Rejected" ? <XCircle className="text-rose-600"/> :
                     a.status === "Pending" ? <Clock3 className="text-amber-500"/> :
                     a.status === "Sent back" ? <XCircle className="text-amber-600"/> :
                     <Circle className="text-slate-300"/>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{a.role}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{a.name}</p>
                    {a.date && <p className="mt-1 text-[11px] text-slate-400">{a.date}</p>}
                    {a.comment && <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-amber-800"><MessageSquare size={14}/> Approver's Comment</div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{a.comment}</p>
                    </div>}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{a.status}</span>
                </div>
              ))}
              {(!request.approvals || request.approvals.length === 0) && <p className="text-sm text-slate-400">No approval steps available yet.</p>}
            </div>
          </div>

          {request.rejectionReason && <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-semibold text-rose-800">Reason for rejection</p>
            <p className="mt-1 text-sm text-rose-700">{request.rejectionReason}</p>
          </div>}

          {canSubmitDraft && request.status === "Draft" && <div className="border-t border-slate-100 pt-5">
            <p className="mb-3 text-sm text-slate-600">This proposal is saved as a draft and has not entered the approval workflow.</p>
            <button disabled={busy} onClick={() => onSubmitDraft?.(request.id)} className="btn-primary w-full">Submit saved proposal</button>
          </div>}

          {actions && request.status !== "Approved" && request.status !== "Rejected" && <div className="border-t border-slate-100 pt-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><MessageSquare size={16}/> Review decision</p>
            <textarea id="review-comment" rows="3" className="field resize-none" placeholder="Add a comment or reason..."/>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button disabled={busy} onClick={() => onDecision?.("Rejected", document.getElementById("review-comment")?.value)} className="btn-danger">Reject</button>
              <button disabled={busy} onClick={() => onSendBack?.(document.getElementById("review-comment")?.value)} className="btn-secondary">Send back</button>
              <button disabled={busy} onClick={() => onDecision?.("Approved", document.getElementById("review-comment")?.value)} className="btn-primary">Approve</button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">Your decision is validated and recorded by the approval workflow.</p>
          </div>}
        </div>
      </aside>
    </div>
  );
}
