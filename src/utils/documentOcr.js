import { createWorker } from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_PDF_PAGES = 5;

async function recognizeCanvas(canvas, onProgress) {
  const worker = await createWorker("eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.(Math.round((message.progress || 0) * 100));
      }
    },
  });

  try {
    const result = await worker.recognize(canvas);
    return result.data.text || "";
  } finally {
    await worker.terminate();
  }
}

export async function extractDocumentText(file, onProgress) {
  if (file.type === "application/pdf") {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageCount = Math.min(pdf.numPages, MAX_PDF_PAGES);
    const chunks = [];

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) throw new Error("Unable to prepare PDF page for OCR.");

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);

      await page.render({ canvasContext: context, viewport }).promise;
      const text = await recognizeCanvas(canvas, (progress) =>
        onProgress?.({
          page: pageNumber,
          totalPages: pageCount,
          progress,
        })
      );

      chunks.push(`--- Page ${pageNumber} ---\n${text}`);
      canvas.width = 0;
      canvas.height = 0;
    }

    if (pdf.numPages > MAX_PDF_PAGES) {
      chunks.push(
        `\n[OCR processed the first ${MAX_PDF_PAGES} of ${pdf.numPages} pages. The remaining pages were not processed.]`
      );
    }

    return chunks.join("\n\n").trim();
  }

  return recognizeCanvas(file, (progress) =>
    onProgress?.({ page: 1, totalPages: 1, progress })
  );
}
