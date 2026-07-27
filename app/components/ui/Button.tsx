"use client";

import { LoaderCircle } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};

export function buttonClassName({
  variant = "secondary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `ui-button ui-button-${variant} ui-button-${size} ${className}`.trim();
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    className = "",
    children,
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      className={buttonClassName({ variant, size, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle className="ui-button-spinner" size={17} aria-hidden="true" /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
