import type { AriaRole, HTMLAttributes, ReactNode } from "react";

type HorizontalScrollerProps = Omit<HTMLAttributes<HTMLDivElement>, "role"> & {
  children: ReactNode;
  ariaLabel: string;
  contentClassName?: string;
  contentRole?: AriaRole;
};

export function HorizontalScroller({
  children,
  ariaLabel,
  className = "",
  contentClassName = "",
  contentRole = "group",
  ...props
}: HorizontalScrollerProps) {
  return (
    <div className={`ui-horizontal-scroller ${className}`.trim()} {...props}>
      <div
        className={`ui-horizontal-scroller-content ${contentClassName}`.trim()}
        role={contentRole}
        aria-label={ariaLabel}
      >
        {children}
      </div>
    </div>
  );
}
