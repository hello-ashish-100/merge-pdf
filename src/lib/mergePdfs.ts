import { PDFDocument } from "pdf-lib";

export const mergePdfs = async (files: File[]): Promise<Uint8Array> => {
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

    pages.forEach((page) => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
};
