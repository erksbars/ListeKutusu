import type { ReactNode } from "react";
import { CircleAlert, Inbox, Info, LoaderCircle, LockKeyhole } from "lucide-react";

type ContentStateKind = "empty" | "loading" | "login" | "error" | "unavailable";

export function ContentState({ kind, title, children, actions }: {
  kind: ContentStateKind;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const Icon = kind === "error" ? CircleAlert : kind === "login" ? LockKeyhole : kind === "loading" ? LoaderCircle : kind === "empty" ? Inbox : Info;
  return <div className={`ui-content-state ui-content-state-${kind}`} role={kind === "error" ? "alert" : "status"} aria-live={kind === "error" ? "assertive" : "polite"}>
    <Icon size={24} aria-hidden="true" />
    <div className="min-w-0">
      <h3>{title}</h3>
      {children && <div className="ui-content-state-copy">{children}</div>}
      {actions && <div className="ui-content-state-actions">{actions}</div>}
    </div>
  </div>;
}
