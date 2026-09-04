import { useCallback, useState } from "react";

import { ERROR_MESSAGES } from "../constants/messages";
import {
  MERGED_FILE_NAME,
  MIN_FILES_TO_MERGE,
  PDF_MIME_TYPE,
} from "../constants/pdf";
import { downloadBytes } from "../lib/download";
import { mergePdfs } from "../lib/mergePdfs";
import { usePdfFiles } from "./usePdfFiles";

export interface UsePdfMergerResult {
  files: File[];
  error: string | null;
  isMerging: boolean;
  canMerge: boolean;
  addFiles: (selection: FileList | File[]) => void;
  removeFile: (index: number) => void;
  moveFile: (from: number, to: number) => void;
  moveFileUp: (index: number) => void;
  moveFileDown: (index: number) => void;
  clearFiles: () => void;
  merge: () => Promise<void>;
}

export const usePdfMerger = (): UsePdfMergerResult => {
  const {
    files,
    addFiles: queueFiles,
    removeFile,
    moveFile,
    moveFileUp,
    moveFileDown,
    clearFiles: clearQueue,
  } = usePdfFiles();

  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addFiles = useCallback(
    (selection: FileList | File[]) => {
      const { rejectedCount } = queueFiles(selection);

      setError(rejectedCount > 0 ? ERROR_MESSAGES.nonPdfRejected : null);
    },
    [queueFiles],
  );

  const clearFiles = useCallback(() => {
    clearQueue();
    setError(null);
  }, [clearQueue]);

  const merge = useCallback(async () => {
    if (files.length < MIN_FILES_TO_MERGE) {
      setError(ERROR_MESSAGES.notEnoughFiles);
      return;
    }

    setIsMerging(true);
    setError(null);

    try {
      const mergedBytes = await mergePdfs(files);

      downloadBytes(mergedBytes, MERGED_FILE_NAME, PDF_MIME_TYPE);
    } catch (mergeError) {
      console.error(mergeError);

      setError(ERROR_MESSAGES.mergeFailed);
    } finally {
      setIsMerging(false);
    }
  }, [files]);

  return {
    files,
    error,
    isMerging,
    canMerge: files.length >= MIN_FILES_TO_MERGE && !isMerging,
    addFiles,
    removeFile,
    moveFile,
    moveFileUp,
    moveFileDown,
    clearFiles,
    merge,
  };
};
