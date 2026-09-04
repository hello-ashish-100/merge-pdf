import { useCallback, useRef, useState } from "react";
import type { DragEvent } from "react";

export interface FileDropHandlers {
  onDragEnter: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

export interface UseFileDropResult {
  isDragActive: boolean;
  dropHandlers: FileDropHandlers;
}

const isFileDrag = (event: DragEvent<HTMLElement>): boolean =>
  Array.from(event.dataTransfer.types).includes("Files");

export const useFileDrop = (
  onFilesDropped: (files: FileList) => void,
): UseFileDropResult => {
  const [isDragActive, setIsDragActive] = useState(false);

  const dragDepthRef = useRef(0);

  const onDragEnter = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) return;

    event.preventDefault();

    dragDepthRef.current += 1;
    setIsDragActive(true);
  }, []);

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) return;

    event.preventDefault();
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    if (!isFileDrag(event)) return;

    event.preventDefault();

    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);

    if (dragDepthRef.current === 0) setIsDragActive(false);
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      if (!isFileDrag(event)) return;

      event.preventDefault();

      dragDepthRef.current = 0;
      setIsDragActive(false);

      onFilesDropped(event.dataTransfer.files);
    },
    [onFilesDropped],
  );

  return {
    isDragActive,
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
};
