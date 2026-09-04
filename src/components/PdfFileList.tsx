import { useDragReorder } from "../hooks/useDragReorder";
import { getFileKey } from "../lib/files";
import { PdfFileItem } from "./PdfFileItem";

export interface PdfFileListProps {
  files: File[];
  onReorder: (from: number, to: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  onClear: () => void;
}

export const PdfFileList = ({
  files,
  onReorder,
  onMoveUp,
  onMoveDown,
  onRemove,
  onClear,
}: PdfFileListProps) => {
  const { draggingIndex, getItemProps, getHandleProps } =
    useDragReorder(onReorder);

  if (files.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Selected PDFs ({files.length})</h2>

          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">
            Drag the handle to reorder - pages merge top to bottom.
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="cursor-pointer text-sm text-zinc-500 transition hover:text-zinc-900 dark:hover:text-white"
        >
          Clear all
        </button>
      </div>

      <ul className="space-y-3">
        {files.map((file, index) => (
          <PdfFileItem
            key={getFileKey(file)}
            file={file}
            position={index + 1}
            isFirst={index === 0}
            isLast={index === files.length - 1}
            isDragging={draggingIndex === index}
            itemProps={getItemProps(index)}
            handleProps={getHandleProps(index)}
            onMoveUp={() => onMoveUp(index)}
            onMoveDown={() => onMoveDown(index)}
            onRemove={() => onRemove(index)}
          />
        ))}
      </ul>
    </section>
  );
};
