type LinkIntent = { button: number; modified: boolean; target?: string; download?: boolean };

export function draftExitTarget(currentHref: string, href: string, intent: LinkIntent) {
  if (intent.button !== 0 || intent.modified || intent.download || (intent.target && intent.target !== "_self")) return null;
  const current = new URL(currentHref), next = new URL(href, current);
  if (!['http:', 'https:'].includes(next.protocol) || next.origin !== current.origin) return null;
  // An in-page anchor does not discard the form. External exits use beforeunload.
  if (next.pathname === current.pathname && next.search === current.search) return null;
  return `${next.pathname}${next.search}${next.hash}`;
}
