import { MIN_FILES_TO_MERGE } from "./pdf";

export const ERROR_MESSAGES = {
  nonPdfRejected: "Only PDF files are allowed.",
  notEnoughFiles: `Please select at least ${MIN_FILES_TO_MERGE} PDF files.`,
  mergeFailed: "Something went wrong while merging the PDFs.",
} as const;
