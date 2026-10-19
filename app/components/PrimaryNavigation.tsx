"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Gamepad2, Home, Library, Users } from "lucide-react";
import { isPrimaryPathActive } from "@/lib/primaryNavigation";

const primaryItems = [
  { href: "/", label: "Ana akış", icon: Home },
  { href: "/discover", label: "Keşfet", icon: Compass },
  { href: "/communities", label: "Topluluklar", icon: Users },
  { href: "/games", label: "Oyunlar", icon: Gamepad2 },
  { href: "/library", label: "Kitaplığım", icon: Library },
] as const;

export function PrimaryNavigation() {
  const pathname = usePathname();

  return (
    <nav className="primary-navigation" aria-label="Ana bölümler">
      {primaryItems.map(({ href, label, icon: Icon }) => {
        const active = isPrimaryPathActive(pathname, href);
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
