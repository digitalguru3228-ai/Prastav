# Prastav – OCR document upload update

## Included changes
- Real supporting-document upload to the private Supabase Storage bucket `prastav-documents`.
- Metadata saved in `public.request_documents`.
- OCR extraction for images (JPG/JPEG, PNG, WEBP) and PDFs.
- PDF OCR processes the first five pages to limit browser memory usage.
- Extracted text is saved using the existing `save_document_ocr` RPC and shown in Proposal Details for manual review.
- Employees can save a draft with a document or upload/OCR before submitting it.
- OCR never makes an approval/rejection decision.

## Replace your project
1. Make a backup of your current `prastav` folder.
2. Extract this ZIP. It contains the project source and configuration, but intentionally excludes `.git`, `node_modules`, and `.env.local`.
3. Copy the extracted project files over your existing project files. Do not delete your existing `.env.local`.
4. In PowerShell, run:
   ```powershell
   npm install
   npm run build
   npm run dev
   ```

## Supabase requirements
This update expects the private Storage bucket `prastav-documents`, the `request_documents` table/RLS/storage policies, and the `save_document_ocr(uuid,text,text)` RPC to already exist. You previously confirmed those SQL steps ran successfully. Do not make the bucket public.

If those SQL steps were not applied to the Supabase project used by this deployment, apply the matching SQL setup before testing uploads. The RPC must permit authenticated owners to save OCR results for their own uploaded documents.

## Test
1. Sign in as an employee.
2. Create a proposal with a PDF or image (up to 10 MB).
3. Submit it, or save it as a draft.
4. Open Proposal Details and expand “View extracted text for manual review”.
5. Sign in as an assigned approver and confirm the document can be opened and OCR text is visible according to the existing RLS policies.

## Notes
- OCR language is English (`eng`) in this version. Gujarati text may not be recognized reliably.
- PDF OCR is limited to five pages per document in this version.
- A failed OCR attempt does not delete the uploaded document; the original can still be opened and reviewed manually.
- The ZIP deliberately does not include `.env.local` or Git history. Keep your own environment file and repository history.
