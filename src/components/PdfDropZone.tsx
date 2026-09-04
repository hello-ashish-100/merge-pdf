import { useCallback } from "react";
import type { ChangeEvent } from "react";

import { PDF_MIME_TYPE } from "../constants/pdf";
import { useFileDrop } from "../hooks/useFileDrop";

const INPUT_ID = "pdf-input";

export interface PdfDropZoneProps {
  onFilesSelected: (files: FileList) => void;
}

export const PdfDropZone = ({ onFilesSelected }: PdfDropZoneProps) => {
  const { isDragActive, dropHandlers } = useFileDrop(onFilesSelected);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) onFilesSelected(event.target.files);

      event.target.value = "";
    },
    [onFilesSelected],
  );

  return (
    <label
      htmlFor={INPUT_ID}
      {...dropHandlers}
      className={`flex min-h-60 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed bg-zinc-50 transition hover:border-zinc-400 hover:bg-zinc-100 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900 ${
        isDragActive
          ? "border-zinc-400 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-900"
          : "border-zinc-300 dark:border-zinc-800"
      }`}
    >
      <div className="text-center">
        <div className="mb-3 text-3xl">+</div>

        <h2 className="text-lg font-semibold">Drop your PDFs here</h2>

        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-500">
          or click to select files
        </p>
      </div>

      <input
        id={INPUT_ID}
        type="file"
        accept={PDF_MIME_TYPE}
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </label>
  );
};
