export type PdfFileKey = string;

export interface AddFilesResult {
  addedCount: number;
  rejectedCount: number;
  duplicateCount: number;
}
