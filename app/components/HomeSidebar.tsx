"use client";

import Link from "next/link";
import {
  Bookmark,
  CalendarDays,
  Compass,
  Gamepad2,
  Home,
  ListMusic,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AchievementProgress } from "./AchievementProgress";

type HomeSidebarProps = {
  authenticated: boolean;
  profileSlug?: string | null;
  rank?: number | null;
  score?: number | null;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onMessage: (message: string) => void;
};

const itemClass =
  "home-nav-item flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold";

export function HomeSidebar({
  authenticated,
  profileSlug,
  rank,
  score,
  collapsed,
  onCollapsedChange,
  onMessage,
}: HomeSidebarProps) {
  const shareHref = authenticated
    ? "#feed-composer"
    : "/account?mode=login&next=%2F%23feed-composer";

  return (
    <aside
      id="home-sidebar"
      className={`home-sidebar hidden lg:block ${collapsed ? "home-sidebar-collapsed" : ""}`}
      aria-label="Ana navigasyon"
    >
      <div className="home-sidebar-head">
        <button
          type="button"
          className="home-sidebar-toggle"
          aria-controls="home-sidebar-navigation"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Sol menüyü genişlet" : "Sol menüyü daralt"}
          title={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          onClick={() => onCollapsedChange(!collapsed)}
        >
          <span className="home-sidebar-toggle-icon home-sidebar-toggle-close" aria-hidden="true">
            <PanelLeftClose size={18} />
          </span>
          <span className="home-sidebar-toggle-icon home-sidebar-toggle-open" aria-hidden="true">
            <PanelLeftOpen size={18} />
          </span>
          <span className="home-sidebar-toggle-label home-nav-label">Menüyü daralt</span>
        </button>
      </div>

      <nav id="home-sidebar-navigation" className="grid gap-1">
        <a href="#main-feed" aria-label="Ana akış" title="Ana akış" aria-current="page" className={`${itemClass} home-nav-item-active`}>
          <Home size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Ana akış</span>
        </a>
        <a
          href={shareHref}
          aria-label="Şarkı paylaş"
          title="Şarkı paylaş"
          className={itemClass}
          onClick={(event) => {
            if (!authenticated) return;
            event.preventDefault();
            window.dispatchEvent(new Event("feed-composer:open"));
            document.getElementById("feed-composer")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
            window.setTimeout(() => document.getElementById("feed-track-search")?.focus(), 350);
          }}
        >
          <MessageSquarePlus size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Şarkı paylaş</span>
        </a>
        <Link href="/discover" aria-label="Keşfet" title="Keşfet" className={itemClass}>
          <Compass size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Keşfet</span>
        </Link>
        <Link href="/games" aria-label="Oyunlar" title="Oyunlar" className={itemClass}>
          <Gamepad2 size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Oyunlar</span>
        </Link>
        {authenticated && (
          <Link href="/?scope=saved" aria-label="Kaydedilenler" title="Kaydedilenler" className={itemClass}>
            <Bookmark size={18} strokeWidth={2.2} aria-hidden="true" />
            <span className="home-nav-label">Kaydedilenler</span>
          </Link>
        )}
        {authenticated && <Link href="/community-saved" aria-label="Topluluk kayıtlarım" title="Topluluk kayıtlarım" className={itemClass}>
          <Bookmark size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Topluluk kayıtlarım</span>
        </Link>}
        {authenticated && <Link href="/community-events" aria-label="Etkinliklerim" title="Etkinliklerim" className={itemClass}>
          <CalendarDays size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Etkinliklerim</span>
        </Link>}
        {authenticated && profileSlug && (
          <Link href={`/u/${profileSlug}`} aria-label="Profilim" title="Profilim" className={itemClass}>
            <UserRound size={18} strokeWidth={2.2} aria-hidden="true" />
            <span className="home-nav-label">Profilim</span>
          </Link>
        )}
      </nav>

      <div className="home-sidebar-secondary mt-5">
        <p>Listeler</p>
        <Link href="/suggest" aria-label="Listeye öner" title="Listeye öner" className={itemClass}>
          <MessageSquarePlus size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Listeye öner</span>
        </Link>
        <Link href="/library?type=music" aria-label="Müzik listem" title="Müzik listem" className={itemClass}>
          <ListMusic size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Müzik listem</span>
        </Link>
        <Link
          href={authenticated ? "/library?type=music" : "/account?mode=login&next=%2Flibrary%3Ftype%3Dmusic"}
          aria-label="Kitaplığım"
          title="Kitaplığım"
          className={itemClass}
        >
          <Settings2 size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Kitaplığım</span>
        </Link>
      </div>

      <div className="home-sidebar-stat mt-5 rounded-2xl p-4">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-cyan-100/75">
          Bu ay
        </p>
        {rank ? (
          <>
            <p className="mt-2 text-2xl font-black text-white">#{rank}</p>
            <p className="mt-1 text-xs leading-5 text-cyan-50/74">{score ?? 0} topluluk puanı</p>
          </>
        ) : (
          <p className="mt-2 text-xs leading-5 text-cyan-50/74">
            Paylaşım yaptıkça sıralamadaki yerin burada görünür.
          </p>
        )}
      </div>

      {authenticated && <AchievementProgress onMessage={onMessage} />}

      <div className="home-sidebar-footer mt-4 grid gap-1 text-xs font-semibold text-cyan-50/72">
        <Link href="/legal" aria-label="Kullanım ve gizlilik" title="Kullanım ve gizlilik" className={itemClass}>
          <ShieldCheck size={18} strokeWidth={2.2} aria-hidden="true" />
          <span className="home-nav-label">Kullanım ve gizlilik</span>
        </Link>
      </div>
    </aside>
  );
}
