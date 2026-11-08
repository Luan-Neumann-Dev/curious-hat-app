import type { MouseEventHandler, ReactNode } from "react";

type HatButtonVariant = "purple" | "red" | "outline";

interface HatButtonProps {
  children: ReactNode;
  variant?: HatButtonVariant;
  type?: "button" | "submit";
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}

// Cores pensadas para ter alto contraste nos dois temas
const variants: Record<HatButtonVariant, string> = {
  purple: "bg-primary hover:bg-primary-hover text-on-primary border border-accent",
  red: "bg-danger-solid hover:bg-danger-hover text-on-primary border border-danger",
  outline: "bg-app hover:bg-raised text-fg border border-fg",
};

export function HatButton({
  children,
  variant = "purple",
  type = "button",
  onClick,
  disabled = false,
  ariaLabel,
  className = "",
}: HatButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={
        `px-4 py-2 rounded-full font-bold text-sm transition-colors
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
        ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
