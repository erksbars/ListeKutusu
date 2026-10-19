export function isPrimaryPathActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/library" && pathname === "/control") return true;
  if (href === "/communities" && ["/community-events", "/community-saved", "/community-cases"].includes(pathname)) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
