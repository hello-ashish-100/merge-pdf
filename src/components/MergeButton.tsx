export interface MergeButtonProps {
  disabled: boolean;
  isMerging: boolean;
  onClick: () => void;
}

export const MergeButton = ({
  disabled,
  isMerging,
  onClick,
}: MergeButtonProps) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className="cursor-pointer rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-30 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
  >
    {isMerging ? "Merging..." : "Merge PDFs"}
  </button>
);
