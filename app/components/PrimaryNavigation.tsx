"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Gamepad2, Home, MessageSquareText } from "lucide-react";

const primaryItems = [
  { href: "/", label: "Ana akış", icon: Home },
  { href: "/discover", label: "Keşfet", icon: Compass },
  { href: "/forum", label: "Forum", icon: MessageSquareText },
  { href: "/games", label: "Oyunlar", icon: Gamepad2 },
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PrimaryNavigation() {
  const pathname = usePathname();

  return (
    <nav className="primary-navigation" aria-label="Ana bölümler">
      {primaryItems.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            prefetch
            aria-current={active ? "page" : undefined}
            className={active ? "primary-navigation-item is-active" : "primary-navigation-item"}
          >
            <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
