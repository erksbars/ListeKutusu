"use client";

import Link from "next/link";
import { LogIn, MessageSquarePlus } from "lucide-react";
import { AccountMenu } from "./AccountMenu";
import { ProfileSearch } from "./ProfileSearch";

type HomeTopbarAccount = {
  ownerName: string;
  email?: string | null;
  slug: string;
  role?: string | null;
};

type HomeTopbarProps = {
  account: HomeTopbarAccount | null;
  onLogout: () => void;
  loginHref?: string;
};

function openComposer() {
  window.dispatchEvent(new Event("feed-composer:open"));
  document
    .getElementById("feed-composer")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => document.getElementById("feed-track-search")?.focus(), 350);
}

export function HomeTopbar({ account, onLogout, loginHref = "/account?mode=login" }: HomeTopbarProps) {
  return (
    <header className="app-topbar home-topbar sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-white sm:text-xl">Ana akış</h1>
          <p className="truncate text-xs font-medium text-cyan-50/72">İlgi alanların, keşiflerin ve toplulukların.</p>
        </div>
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2">
        <ProfileSearch />
        {account ? (
          <>
            <button
              type="button"
              onClick={openComposer}
              className="topbar-primary-button hidden lg:inline-flex"
            >
              <MessageSquarePlus size={17} aria-hidden="true" />
              <span>Şarkı paylaş</span>
            </button>
            <AccountMenu
              ownerName={account.ownerName}
              email={account.email}
              profileSlug={account.slug}
              role={account.role}
              onLogout={onLogout}
            />
          </>
        ) : (
          <Link
            href={loginHref}
            aria-label="Giriş yap"
            className="topbar-primary-button home-login-button"
          >
            <LogIn size={17} aria-hidden="true" />
            <span>Giriş yap</span>
          </Link>
        )}
      </div>
    </header>
  );
}
