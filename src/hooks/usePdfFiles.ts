import { useCallback, useRef, useState } from "react";

import { getFileKey, isPdfFile } from "../lib/files";
import type { AddFilesResult } from "../types/pdf";

export interface UsePdfFilesResult {
  files: File[];
  addFiles: (selection: FileList | File[]) => AddFilesResult;
  removeFile: (index: number) => void;
  moveFile: (from: number, to: number) => void;
  moveFileUp: (index: number) => void;
  moveFileDown: (index: number) => void;
  clearFiles: () => void;
}

export const usePdfFiles = (): UsePdfFilesResult => {
  const [files, setFiles] = useState<File[]>([]);

  const filesRef = useRef<File[]>(files);

  const commit = useCallback((next: File[]) => {
    filesRef.current = next;
    setFiles(next);
  }, []);

  const addFiles = useCallback(
    (selection: FileList | File[]): AddFilesResult => {
      const candidates = Array.from(selection);
      const pdfs = candidates.filter(isPdfFile);

      const seenKeys = new Set(filesRef.current.map(getFileKey));
      const additions: File[] = [];

      for (const file of pdfs) {
        const key = getFileKey(file);

        if (seenKeys.has(key)) continue;

        seenKeys.add(key);
        additions.push(file);
      }

      if (additions.length > 0) {
        commit([...filesRef.current, ...additions]);
      }

      return {
        addedCount: additions.length,
        rejectedCount: candidates.length - pdfs.length,
        duplicateCount: pdfs.length - additions.length,
      };
    },
    [commit],
  );

  const removeFile = useCallback(
    (index: number) => {
      commit(filesRef.current.filter((_, fileIndex) => fileIndex !== index));
    },
    [commit],
  );

  const moveFile = useCallback(
    (from: number, to: number) => {
      const current = filesRef.current;

      if (from < 0 || from >= current.length) return;

      const target = Math.min(Math.max(to, 0), current.length - 1);

      if (target === from) return;

      const next = [...current];
      const [moved] = next.splice(from, 1);

      next.splice(target, 0, moved);

      commit(next);
    },
    [commit],
  );

  const moveFileUp = useCallback(
    (index: number) => moveFile(index, index - 1),
    [moveFile],
  );

  const moveFileDown = useCallback(
    (index: number) => moveFile(index, index + 1),
    [moveFile],
  );

  const clearFiles = useCallback(() => commit([]), [commit]);

  return {
    files,
    addFiles,
    removeFile,
    moveFile,
    moveFileUp,
    moveFileDown,
    clearFiles,
  };
};
