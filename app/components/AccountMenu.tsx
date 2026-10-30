"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, ShieldCheck, UserRound, Home, Compass, Gamepad2, Library, Bookmark, CalendarDays, CircleHelp, Settings2, LogIn } from "lucide-react";
import { useHeaderNavigation } from "./HeaderNavigationContext";
import { NotificationCenter } from "./NotificationCenter";

type AccountMenuProps = {
  ownerName: string;
  email?: string | null;
  profileSlug?: string | null;
  role?: string | null;
  onLogout: () => void;
  inHeader?: boolean;
  authenticated?: boolean;
  loginHref?: string;
  logoutBusy?: boolean;
};

export function AccountMenu(props: AccountMenuProps) {
  const commonHeader = useHeaderNavigation();
  if (commonHeader && !props.inHeader) return null;
  return <AccountMenuContent {...props} />;
}

function AccountMenuContent({ ownerName, email, profileSlug, role, onLogout, inHeader = false, authenticated = true, loginHref = "/account?mode=login", logoutBusy = false }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname(), query = useSearchParams().toString();
  useEffect(() => setOpen(false), [pathname, query]);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function menuItems() {
    return Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)') ?? []
    );
  }

  function focusMenuItem(position: "first" | "last") {
    window.requestAnimationFrame(() => {
      const items = menuItems();
      items[position === "first" ? 0 : items.length - 1]?.focus();
    });
  }

  useEffect(() => {
    if (!open) return;

    function closeMenu(event: MouseEvent) {
      if (!detailsRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        summaryRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <>
      {authenticated && <NotificationCenter inHeader={inHeader} />}
      <details
        ref={detailsRef}
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="account-menu"
      >
      <summary
        ref={summaryRef}
        id="account-menu-trigger"
        className="topbar-user-button cursor-pointer list-none"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="account-menu-popover"
        aria-label={authenticated ? `${ownerName} hesap menüsü` : "Profil ve gezinme menüsü"}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          setOpen(true);
          focusMenuItem(event.key === "ArrowDown" ? "first" : "last");
        }}
      >
        <span className="nav-avatar">
          {(ownerName || email || "U").slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-bold sm:block">{ownerName}</span>
        <ChevronDown size={14} className="hidden text-cyan-50/75 sm:block" aria-hidden="true" />
      </summary>
      <div
        ref={menuRef}
        id="account-menu-popover"
        className="account-menu-popover"
        role="menu"
        aria-labelledby="account-menu-trigger"
        onKeyDown={(event) => {
          const items = menuItems();
          const currentIndex = items.indexOf(document.activeElement as HTMLElement);
          if (event.key === "Tab") {
            setOpen(false);
            return;
          }
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const nextIndex =
            event.key === "Home"
              ? 0
              : event.key === "End"
                ? items.length - 1
                : event.key === "ArrowDown"
                  ? (currentIndex + 1 + items.length) % items.length
                  : (currentIndex - 1 + items.length) % items.length;
          items[nextIndex]?.focus();
        }}
      >
        <div className="account-menu-identity" role="presentation">
          <strong>{ownerName}</strong>
          {email && <small>{email}</small>}
        </div>
        {profileSlug && authenticated && <Link href={`/u/${profileSlug}`} role="menuitem" onClick={() => setOpen(false)}><UserRound size={16} aria-hidden="true" />Profilim</Link>}
        <p className="account-menu-heading" role="presentation">Keşfet ve gezin</p>
        {[
          { href: "/", label: "Ana akış", Icon: Home },
          { href: "/discover", label: "Keşfet", Icon: Compass },
          { href: "/games", label: "Oyunlar", Icon: Gamepad2 },
          { href: "/library", label: "Kitaplığım", Icon: Library },
        ].map(({ href, label, Icon }) => <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)}><Icon size={16} aria-hidden="true" />{label}</Link>)}
        <p className="account-menu-heading" role="presentation">Kişisel alan</p>
        {[
          { href: "/?scope=saved", label: "Müzik kayıtlarım", Icon: Bookmark },
          { href: "/community-saved", label: "Topluluk kayıtlarım", Icon: Bookmark },
          { href: "/community-events", label: "Etkinliklerim", Icon: CalendarDays },
          { href: "/account", label: "Hesap ve profil", Icon: Settings2 },
          { href: "/legal", label: "Kullanım ve gizlilik", Icon: CircleHelp },
        ].map(({ href, label, Icon }) => <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)}><Icon size={16} aria-hidden="true" />{label}</Link>)}
        {!authenticated && <Link href={loginHref} role="menuitem" onClick={() => setOpen(false)}><LogIn size={16} aria-hidden="true" />Giriş yap</Link>}
        {authenticated && (role === "moderator" || role === "admin") && (
          <Link href="/admin/forum" role="menuitem" onClick={() => setOpen(false)}>
            <ShieldCheck size={16} /> Forum moderasyonu
          </Link>
        )}
        {authenticated && <button
          type="button"
          disabled={logoutBusy}
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
        >
          <LogOut size={16} /> {logoutBusy ? "Çıkış yapılıyor…" : "Çıkış yap"}
        </button>}
      </div>
      </details>
    </>
  );
}
