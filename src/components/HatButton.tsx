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

// Cores pensadas para ter alto contraste no fundo preto (Lighthouse 90+)
const variants: Record<HatButtonVariant, string> = {
  purple: "bg-purple-700 hover:bg-purple-600 text-white border border-purple-400",
  red: "bg-red-700 hover:bg-red-600 text-white border border-red-400",
  outline: "bg-black hover:bg-zinc-900 text-white border border-white",
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
