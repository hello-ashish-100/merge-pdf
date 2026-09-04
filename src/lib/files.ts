import { PDF_MIME_TYPE } from "../constants/pdf";
import type { PdfFileKey } from "../types/pdf";

export const isPdfFile = (file: File): boolean => file.type === PDF_MIME_TYPE;

export const getFileKey = (file: File): PdfFileKey =>
  `${file.name}-${file.size}-${file.lastModified}`;

export const formatFileSize = (bytes: number): string =>
  `${(bytes / 1024 / 1024).toFixed(2)} MB`;
