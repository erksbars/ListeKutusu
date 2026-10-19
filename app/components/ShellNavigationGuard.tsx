"use client";

import { useDraftNavigationGuard } from "./DraftNavigationProvider";

/** Compatibility entry for the account form; all registered drafts share one guard. */
export function ShellNavigationGuard({ dirty, busy }: { dirty: boolean; busy: boolean }) {
  useDraftNavigationGuard({ dirty, busy });
  return null;
}
