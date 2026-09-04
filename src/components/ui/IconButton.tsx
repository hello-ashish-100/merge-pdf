import type { ButtonHTMLAttributes } from "react";

type IconButtonVariant = "default" | "danger";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
}

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  default:
    "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white",
  danger:
    "text-red-500 hover:bg-zinc-200 dark:text-red-400 dark:hover:bg-zinc-800",
};

export const IconButton = ({
  variant = "default",
  className = "",
  ...buttonProps
}: IconButtonProps) => (
  <button
    type="button"
    className={`cursor-pointer rounded-md px-2 py-1 transition disabled:cursor-not-allowed disabled:opacity-20 ${VARIANT_CLASSES[variant]} ${className}`}
    {...buttonProps}
  />
);
