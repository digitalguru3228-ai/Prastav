import { supabase } from "../lib/supabase";
import { extractDocumentText } from "./documentOcr";

const BUCKET = "prastav-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function safeFileName(name) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "_")
    .replace(/^\.|\.{2,}/g, "_")
    .slice(-100);
  return cleaned || "supporting-document";
}

export async function uploadProposalDocument(requestId, file, onStatus = () => {}) {
  if (!file) return null;
  if (!requestId) throw new Error("Proposal draft ID is missing.");
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("Document must be between 1 byte and 10 MB.");
  }

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userResult?.user;
  if (!user?.id) throw new Error("Your session expired. Please sign in again.");

  const uniqueName = `${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const storagePath = `${requestId}/${user.id}/${uniqueName}`;

  onStatus("Uploading supporting document...");
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  let documentRow;
  try {
    const { data, error: insertError } = await supabase
      .from("request_documents")
      .insert({
        request_id: requestId,
        uploaded_by: user.id,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        file_size: file.size,
        ocr_status: "pending",
      })
      .select("*")
      .single();

    if (insertError) throw insertError;
    documentRow = data;
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }

  try {
    onStatus("Extracting text with OCR...");
    const extractedText = await extractDocumentText(file, (progress) => {
      onStatus(
        `Reading document: page ${progress.page}/${progress.totalPages} (${progress.progress}%)`
      );
    });

    const { error: ocrError } = await supabase.rpc("save_document_ocr", {
      p_document_id: documentRow.id,
      p_extracted_text: extractedText.slice(0, 200000),
      p_ocr_status: "completed",
    });

    if (ocrError) throw ocrError;
    return { ...documentRow, extracted_text: extractedText, ocr_status: "completed" };
  } catch (error) {
    console.error("Document OCR failed:", error);
    const { error: statusError } = await supabase.rpc("save_document_ocr", {
      p_document_id: documentRow.id,
      p_extracted_text: null,
      p_ocr_status: "failed",
    });
    if (statusError) console.error("Unable to save OCR failure status:", statusError);
    return { ...documentRow, extracted_text: "", ocr_status: "failed", ocr_error: error.message };
  }
}
