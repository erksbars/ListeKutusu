"use client";

import Link from "next/link";
import { Compass, Home, MessageSquarePlus, MessageSquareText, UserRound } from "lucide-react";

type MobileDockProps = {
  authenticated: boolean;
  profileSlug?: string | null;
  active?: "home" | "discover" | "forum" | "profile" | null;
};

const itemClass = "mobile-dock-item";

export function MobileDock({ authenticated, profileSlug, active = "home" }: MobileDockProps) {
  const profileHref = authenticated && profileSlug ? `/u/${profileSlug}` : "/account?mode=login";
  const shareHref = authenticated
    ? active === "home"
      ? "#feed-composer"
      : "/#feed-composer"
    : "/account?mode=login&next=%2F%23feed-composer";

  return (
    <nav className="mobile-dock lg:hidden" aria-label="Mobil navigasyon">
      <Link href={active === "home" ? "#main-feed" : "/"} aria-current={active === "home" ? "page" : undefined} className={`${itemClass} ${active === "home" ? "mobile-dock-item-active" : ""}`}>
        <Home size={19} strokeWidth={active === "home" ? 2.7 : 2} aria-hidden="true" />
        <span>Akış</span>
      </Link>
      <Link href="/discover" aria-current={active === "discover" ? "page" : undefined} className={`${itemClass} ${active === "discover" ? "mobile-dock-item-active" : ""}`}>
        <Compass size={19} strokeWidth={active === "discover" ? 2.7 : 2} aria-hidden="true" />
        <span>Keşfet</span>
      </Link>
      <a
        href={shareHref}
        onClick={(event) => {
          if (!authenticated || active !== "home") return;
          event.preventDefault();
          window.dispatchEvent(new Event("feed-composer:open"));
          document.getElementById("feed-composer")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          window.setTimeout(() => document.getElementById("feed-track-search")?.focus(), 350);
        }}
        aria-label={authenticated ? "Şarkı paylaş" : "Şarkı paylaşmak için giriş yap"}
        className={`${itemClass} mobile-dock-create`}
      >
        <MessageSquarePlus size={21} aria-hidden="true" />
        <span>Paylaş</span>
      </a>
      <Link href="/forum" aria-current={active === "forum" ? "page" : undefined} className={`${itemClass} ${active === "forum" ? "mobile-dock-item-active" : ""}`}>
        <MessageSquareText size={19} strokeWidth={active === "forum" ? 2.7 : 2} aria-hidden="true" />
        <span>Forum</span>
      </Link>
      <Link
        href={profileHref}
        aria-current={active === "profile" ? "page" : undefined}
        className={`${itemClass} ${active === "profile" ? "mobile-dock-item-active" : ""}`}
      >
        <UserRound size={19} strokeWidth={active === "profile" ? 2.7 : 2} aria-hidden="true" />
        <span>Profil</span>
      </Link>
    </nav>
  );
}
