import type { HTMLAttributes, ReactNode } from "react";

type CardTone = "default" | "muted" | "raised";

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: "article" | "aside" | "div" | "section";
  tone?: CardTone;
  interactive?: boolean;
};

export function Card({
  as: Component = "section",
  tone = "default",
  interactive = false,
  className = "",
  ...props
}: CardProps) {
  return (
    <Component
      className={`ui-card ui-card-${tone} ${interactive ? "ui-card-interactive" : ""} ${className}`.trim()}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-card-header ${className}`.trim()} {...props} />;
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h2 className={`ui-card-title ${className}`.trim()}>{children}</h2>;
}

export function CardDescription({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`ui-card-description ${className}`.trim()}>{children}</p>;
}

export function CardContent({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-card-content ${className}`.trim()} {...props} />;
}

export function CardFooter({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`ui-card-footer ${className}`.trim()} {...props} />;
}
