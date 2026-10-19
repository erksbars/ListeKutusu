"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ListMusic, LogOut, Settings2, ShieldCheck, UserRound } from "lucide-react";
import { NotificationCenter } from "./NotificationCenter";

type AccountMenuProps = {
  ownerName: string;
  email?: string | null;
  profileSlug?: string | null;
  role?: string | null;
  onLogout: () => void;
};

export function AccountMenu({ ownerName, email, profileSlug, role, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function menuItems() {
    return Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
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
      <NotificationCenter />
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
        aria-label={`${ownerName} hesap menüsü`}
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
        {profileSlug && (
          <Link href={`/u/${profileSlug}`} role="menuitem" onClick={() => setOpen(false)}>
            <UserRound size={16} /> Profilim
          </Link>
        )}
        <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>
          <ListMusic size={16} /> Hesabım
        </Link>
        <Link href="/library?type=music" role="menuitem" onClick={() => setOpen(false)}>
          <Settings2 size={16} /> Kitaplığım
        </Link>
        {(role === "moderator" || role === "admin") && (
          <Link href="/admin/forum" role="menuitem" onClick={() => setOpen(false)}>
            <ShieldCheck size={16} /> Forum moderasyonu
          </Link>
        )}
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
        >
          <LogOut size={16} /> Çıkış yap
        </button>
      </div>
      </details>
    </>
  );
}
