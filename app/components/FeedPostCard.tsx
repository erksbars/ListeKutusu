"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bookmark, EyeOff, ExternalLink, Flag, Heart, ListPlus, MessageCircle, MoreHorizontal, Music2, Pencil, Trash2, UserPlus } from "lucide-react";

export type FeedCardPost = {
  id: string;
  trackName: string;
  artistName: string;
  albumName: string | null;
  externalUrl: string | null;
  note: string | null;
  tags: string[];
  createdAt: string;
  likeCount: number;
  addCount: number;
  commentCount: number;
  likedByMe: boolean;
  addedByMe: boolean;
  savedByMe: boolean;
  followingAuthor: boolean;
  isMine: boolean;
  recommendationReason: string | null;
  author: {
    id: string;
    ownerName: string;
    slug: string;
  };
};

type FeedPostCardProps = {
  post: FeedCardPost;
  tone?: "primary" | "accent" | "secondary";
  liking: boolean;
  adding: boolean;
  following: boolean;
  saving: boolean;
  menuOpen: boolean;
  onToggleFollow: () => void;
  onAddToList: () => void;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onHide: () => void;
  onToggleMenu: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function FeedPostCard({
  post,
  tone = "primary",
  liking,
  adding,
  following,
  saving,
  menuOpen,
  onToggleFollow,
  onAddToList,
  onToggleLike,
  onToggleSave,
  onHide,
  onToggleMenu,
  onEdit,
  onDelete,
  onReport,
}: FeedPostCardProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const noteCanExpand = Boolean(post.note && (post.note.length > 180 || post.note.split("\n").length > 3));

  useEffect(() => {
    if (!menuOpen) return;

    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) onToggleMenu();
    }

    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onToggleMenu();
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [menuOpen, onToggleMenu]);

  return (
    <article
      id={`post-${post.id}`}
      className={`feed-post-card feed-post-tone-${tone} scroll-mt-24`}
    >
      <header className="feed-post-header">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={`/u/${post.author.slug}`}
            className="nav-avatar feed-post-avatar"
            aria-label={`${post.author.ownerName} profilini aç`}
          >
            {post.author.ownerName.slice(0, 1).toUpperCase()}
          </Link>
          <div className="min-w-0">
            <div className="feed-post-identity">
              <Link
                href={`/u/${post.author.slug}`}
                className="feed-post-author"
              >
                {post.author.ownerName}
              </Link>
              <span aria-hidden="true">·</span>
              <Link href={`/p/${post.id}`} className="feed-post-permalink" aria-label={`${post.trackName} paylaşımını aç`}>
                <time dateTime={post.createdAt}>
                  {dateFormatter.format(new Date(post.createdAt))}
                </time>
              </Link>
            </div>
            {post.recommendationReason && (
              <p className="feed-recommendation-reason">
                {post.recommendationReason}
              </p>
            )}
          </div>
        </div>
        <div ref={menuRef} className="relative flex shrink-0 items-center gap-2">
          {!post.isMine && (
            <button
              type="button"
              onClick={onToggleFollow}
              disabled={following}
              aria-pressed={post.followingAuthor}
              className={`feed-follow-button ${post.followingAuthor ? "feed-follow-button-active" : ""}`}
            >
              <UserPlus size={15} aria-hidden="true" />
              <span>
                {following ? "İşleniyor" : post.followingAuthor ? "Takipte" : "Takip et"}
              </span>
            </button>
          )}
          <button
            type="button"
            aria-label={`Paylaşım menüsü - ${post.trackName}`}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={onToggleMenu}
            className="feed-menu-button"
          >
            <MoreHorizontal size={19} />
          </button>
          {menuOpen && (
            <div className="feed-post-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onToggleSave();
                  onToggleMenu();
                }}
                disabled={saving}
              >
                <span className="flex items-center gap-2">
                  <Bookmark size={15} fill={post.savedByMe ? "currentColor" : "none"} />
                  {saving ? "Kaydediliyor..." : post.savedByMe ? "Kaydı kaldır" : "Daha sonra kaydet"}
                </span>
              </button>
              {post.isMine ? (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onEdit}
                  >
                    <span className="flex items-center gap-2"><Pencil size={15} /> Düzenle</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onDelete}
                    className="feed-post-menu-danger"
                  >
                    <span className="flex items-center gap-2"><Trash2 size={15} /> Paylaşımı sil</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onHide();
                      onToggleMenu();
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <EyeOff size={15} />
                      İlgilenmiyorum
                    </span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onReport}
                    className="feed-post-menu-danger"
                  >
                    <span className="flex items-center gap-2"><Flag size={15} /> Şikâyet et</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </header>
      <div className="feed-track-block">
        <span className="feed-track-icon" aria-hidden="true"><Music2 size={18} /></span>
        <div className="min-w-0">
          <h2><Link href={`/p/${post.id}`}>{post.trackName}</Link></h2>
          <p>
            {post.artistName}{post.albumName ? ` · ${post.albumName}` : ""}
          </p>
        </div>
        {post.externalUrl && (
          <a href={post.externalUrl} target="_blank" rel="noreferrer" className="feed-external-button" aria-label="Spotify'da aç" title="Spotify'da aç">
            <ExternalLink size={16} />
          </a>
        )}
      </div>
      {(post.note || post.tags.length > 0) && (
        <div className="feed-post-context">
          {post.note && (
            <div className="feed-post-note-wrap">
              <p className={`feed-post-note ${noteExpanded ? "feed-post-note-expanded" : ""}`}>{post.note}</p>
              {noteCanExpand && (
                <button type="button" className="feed-post-note-toggle" onClick={() => setNoteExpanded((current) => !current)}>
                  {noteExpanded ? "Daha az göster" : "Devamını gör"}
                </button>
              )}
            </div>
          )}
          {post.tags.length > 0 && (
            <div className="feed-post-tags" aria-label="Paylaşım etiketleri">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={`${post.id}-${tag}`}>#{tag}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="feed-action-row">
        <button type="button" onClick={onToggleLike} disabled={liking} aria-pressed={post.likedByMe} aria-label={liking ? "Beğeni güncelleniyor" : post.likedByMe ? "Beğeniyi kaldır" : "Beğen"} className={post.likedByMe ? "feed-action feed-action-active" : "feed-action"}>
          <Heart size={17} fill={post.likedByMe ? "currentColor" : "none"} />
          <span>{liking ? "İşleniyor" : "Beğen"}</span><strong>{post.likeCount}</strong>
        </button>
        <button type="button" onClick={onAddToList} disabled={post.addedByMe || adding} aria-label={adding ? "Şarkı listene ekleniyor" : post.addedByMe ? "Şarkı listende" : "Şarkıyı listene ekle"} className={post.addedByMe ? "feed-action feed-action-added" : "feed-action"}>
          <ListPlus size={18} />
          <span>{adding ? "Ekleniyor" : post.addedByMe ? "Listemde" : "Listeme ekle"}</span><strong>{post.addCount}</strong>
        </button>
        <button
          type="button"
          onClick={onToggleSave}
          disabled={saving}
          aria-pressed={post.savedByMe}
          aria-label={saving ? "Paylaşım kaydediliyor" : post.savedByMe ? "Kaydı kaldır" : "Daha sonra kaydet"}
          className={post.savedByMe ? "feed-action feed-action-saved" : "feed-action"}
        >
          <Bookmark size={17} fill={post.savedByMe ? "currentColor" : "none"} />
          <span>{saving ? "Kaydediliyor" : post.savedByMe ? "Kaydedildi" : "Kaydet"}</span>
        </button>
        <Link
          href={`/p/${post.id}#comments`}
          className="feed-action"
          aria-label={`${post.commentCount} yorumu görüntüle`}
        >
          <MessageCircle size={17} />
          <span>Yorumlar</span><strong>{post.commentCount}</strong>
        </Link>
      </div>
    </article>
  );
}
