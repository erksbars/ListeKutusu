"use client";

import { Music2, PencilLine, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { TrackResult as FeedTrack } from "../hooks/feedTypes";
import { useSessionNavigation } from "../hooks/useSessionNavigation";
import { Button, TextField } from "./ui";

type FeedAccount = {
  ownerName: string;
  email?: string | null;
} | null;

type FeedComposerProps = {
  account: FeedAccount;
  query: string;
  results: FeedTrack[];
  selectedTrack: FeedTrack | null;
  tags: string;
  searching: boolean;
  posting: boolean;
  onQueryChange: (value: string) => void;
  onSelectTrack: (track: FeedTrack) => void;
  onClearTrack: () => void;
  onTagsChange: (value: string) => void;
  onSubmit: () => void;
};

export function FeedComposer({
  account,
  query,
  results,
  selectedTrack,
  tags,
  searching,
  posting,
  onQueryChange,
  onSelectTrack,
  onClearTrack,
  onTagsChange,
  onSubmit,
}: FeedComposerProps) {
  const { goToLogin } = useSessionNavigation();
  const [expanded, setExpanded] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const showResults = !selectedTrack && query.trim().length >= 2;
  const trackError = attemptedSubmit && !selectedTrack;
  function openComposer() {
    if (!account) {
      goToLogin("/#feed-composer");
      return;
    }
    setExpanded(true);
  }

  useEffect(() => {
    const open = () => {
      if (account) setExpanded(true);
      else goToLogin("/#feed-composer");
    };
    const close = () => {
      setExpanded(false);
      setAttemptedSubmit(false);
    };
    window.addEventListener("feed-composer:open", open);
    window.addEventListener("feed-composer:close", close);
    if (window.location.hash === "#feed-composer") open();
    return () => {
      window.removeEventListener("feed-composer:open", open);
      window.removeEventListener("feed-composer:close", close);
    };
  }, [account, goToLogin]);

  if (!expanded) {
    return (
      <section id="feed-composer" className="feed-composer-trigger mt-4 scroll-mt-24">
        <button
          type="button"
          onClick={openComposer}
          className="feed-composer-trigger-button"
        >
          <span className="nav-avatar" aria-hidden="true">
            {(account?.ownerName || account?.email || "M").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <strong>{account ? "Bir şarkı paylaş" : "Paylaşmak için giriş yap"}</strong>
            <small>{account ? "Şarkıyı seç, istersen etiket ekle ve akışta paylaş." : "Hesabına dön ve topluluğun keşif akışına katıl."}</small>
          </span>
          <span className="feed-composer-trigger-icon"><Plus size={18} /></span>
        </button>
      </section>
    );
  }

  return (
    <section id="feed-composer" className="feed-composer mt-4 scroll-mt-24">
      <div className="flex items-center gap-3">
        <span className="nav-avatar" aria-hidden="true">
          {(account?.ownerName || account?.email || "M").slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h2 className="feed-composer-title">
            {account ? `${account.ownerName} olarak paylaş` : "Akışa katıl"}
          </h2>
          <p className="feed-composer-copy">
            Şarkını seç ve keşif akışına ekle.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(false)}
          className="feed-composer-close"
          aria-label="Paylaşım alanını kapat"
          title="Kapat"
        >
          <X size={17} />
        </Button>
      </div>

      <div className="mt-4 grid gap-3">
        <TextField
          id="feed-track-search"
          type="search"
          label="Paylaşılacak şarkı"
          autoComplete="off"
          placeholder="Şarkı veya sanatçı ara..."
          value={selectedTrack ? `${selectedTrack.name} - ${selectedTrack.artist}` : query}
          onChange={(event) => {
            setAttemptedSubmit(false);
            onQueryChange(event.target.value);
          }}
          error={trackError ? "Paylaşmadan önce bir şarkı seçmelisin." : undefined}
          className="feed-composer-input h-12 text-sm font-semibold"
          trailingAction={selectedTrack ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearTrack}
              aria-label="Seçilen şarkıyı değiştir"
              title="Şarkıyı değiştir"
            >
              <PencilLine size={16} />
            </Button>
          ) : undefined}
        />

        {showResults && (
          <div
            className="feed-composer-results"
            aria-live="polite"
          >
            {searching && (
              <p className="feed-composer-status">Aranıyor...</p>
            )}
            {!searching && results.length === 0 && (
              <p className="feed-composer-status">
                Sonuç bulunamadı. Şarkı veya sanatçı adını kontrol et.
              </p>
            )}
            {!searching &&
              results.slice(0, 6).map((track) => (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => {
                    setAttemptedSubmit(false);
                    onSelectTrack(track);
                  }}
                  className="feed-composer-result"
                >
                  <span className="min-w-0">
                    <strong>{track.name}</strong>
                    <small>
                      {track.artist} · {track.album}
                    </small>
                  </span>
                  <span className="feed-composer-select">
                    Seç
                  </span>
                </button>
              ))}
          </div>
        )}

        <TextField
          id="feed-tags"
          type="text"
          label="Etiketler (isteğe bağlı)"
          labelMeta={`${tags.length}/120`}
          value={tags}
          maxLength={120}
          onChange={(event) => onTagsChange(event.target.value.slice(0, 120))}
          placeholder="rock, gece, keşif"
          hint="Virgülle ayır; en fazla dört etiket gösterilir."
          className="feed-composer-input h-12 text-sm font-semibold"
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="feed-composer-help">
            Beğeniler ve başkalarının listesine giren keşifler puan kazandırır.
          </p>
          <Button
            variant="primary"
            onClick={() => {
              if (!selectedTrack) {
                setAttemptedSubmit(true);
                document.getElementById("feed-track-search")?.focus();
                return;
              }
              setAttemptedSubmit(false);
              onSubmit();
            }}
            loading={posting}
            leadingIcon={<Music2 size={16} />}
            className="sm:self-end"
          >
            {account ? "Şarkıyı paylaş" : "Giriş yap ve paylaş"}
          </Button>
        </div>
      </div>
    </section>
  );
}
