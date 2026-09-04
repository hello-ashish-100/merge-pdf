import type {
  DragReorderHandleProps,
  DragReorderItemProps,
} from "../hooks/useDragReorder";
import { formatFileSize } from "../lib/files";
import { IconButton } from "./ui/IconButton";

const GripIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="h-5 w-5">
    <circle cx="6" cy="4" r="1.4" />
    <circle cx="10" cy="4" r="1.4" />
    <circle cx="6" cy="8" r="1.4" />
    <circle cx="10" cy="8" r="1.4" />
    <circle cx="6" cy="12" r="1.4" />
    <circle cx="10" cy="12" r="1.4" />
  </svg>
);

export interface PdfFileItemProps {
  file: File;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  isDragging: boolean;
  itemProps: DragReorderItemProps;
  handleProps: DragReorderHandleProps;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

export const PdfFileItem = ({
  file,
  position,
  isFirst,
  isLast,
  isDragging,
  itemProps,
  handleProps,
  onMoveUp,
  onMoveDown,
  onRemove,
}: PdfFileItemProps) => (
  <li
    {...itemProps}
    className={`relative flex touch-manipulation items-center justify-between rounded-xl border p-4 transition-colors select-none ${
      isDragging
        ? "cursor-move border-zinc-300 bg-white shadow-2xl shadow-zinc-900/15 dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-black/60"
        : "cursor-move border-zinc-200 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
    }`}
  >
    <div className="flex min-w-0 items-center gap-2">
      <span
        {...handleProps}
        aria-hidden="true"
        className="-m-2 shrink-0 cursor-move touch-none p-2 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-400"
      >
        <GripIcon />
      </span>

      <div className="min-w-0 ps-1">
        <p className="truncate text-sm font-medium">
          {position}. {file.name}
        </p>

        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-500">
          {formatFileSize(file.size)}
        </p>
      </div>
    </div>

    <div className="ml-4 flex items-center gap-2">
      <IconButton
        disabled={isFirst}
        onClick={onMoveUp}
        aria-label={`Move ${file.name} up`}
      >
        ↑
      </IconButton>

      <IconButton
        disabled={isLast}
        onClick={onMoveDown}
        aria-label={`Move ${file.name} down`}
      >
        ↓
      </IconButton>

      <IconButton
        variant="danger"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
      >
        ×
      </IconButton>
    </div>
  </li>
);
