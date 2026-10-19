"use client";

import Link from "next/link";
import { useState } from "react";
import { Bookmark, ExternalLink, Heart, Link2, ListPlus, Music2 } from "lucide-react";
import type { FeedPostDetail } from "@/lib/feedPostDetail";
import { accountLoginPath } from "@/lib/navigation";
import { AccountMenu } from "@/app/components/AccountMenu";
import { PageTopbar } from "@/app/components/PageTopbar";
import { Toast } from "@/app/components/Toast";
import { Button, buttonClassName } from "@/app/components/ui";
import { useSessionNavigation } from "@/app/hooks/useSessionNavigation";
import { PostComments } from "@/app/(social)/p/[id]/PostComments";

type Viewer = {
  id: string;
  ownerName: string;
  email: string | null;
  slug: string;
  role: string;
} | null;

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export default function PostDetailClient({
  initialPost,
  viewer,
  returnTo = "/",
}: {
  initialPost: FeedPostDetail;
  viewer: Viewer;
  returnTo?: string;
}) {
  const { logoutToHome, goToLogin } = useSessionNavigation();
  const [post, setPost] = useState(initialPost);
  const [busy, setBusy] = useState<"like" | "save" | "add" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const detailPath = `/p/${post.id}${returnTo !== "/" ? `?from=${encodeURIComponent(returnTo)}` : ""}`;

  function requireViewer() {
    if (viewer) return false;
    goToLogin(detailPath);
    return true;
  }

  async function toggleLike() {
    if (requireViewer() || post.isMine || busy) return;
    const previous = post;
    setBusy("like");
    setPost((current) => ({
      ...current,
      likedByMe: !current.likedByMe,
      likeCount: Math.max(0, current.likeCount + (current.likedByMe ? -1 : 1)),
    }));
    try {
      const response = await fetch("/api/feed/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Beğeni güncellenemedi.");
      setPost((current) => ({ ...current, likedByMe: data.liked, likeCount: data.likeCount }));
    } catch (error) {
      setPost(previous);
      setMessage(error instanceof Error ? error.message : "Beğeni güncellenemedi.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleSave() {
    if (requireViewer() || busy) return;
    const previous = post;
    setBusy("save");
    setPost((current) => ({ ...current, savedByMe: !current.savedByMe }));
    try {
      const response = await fetch("/api/feed/saves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Kayıt durumu güncellenemedi.");
      setPost((current) => ({ ...current, savedByMe: data.saved }));
      setMessage(data.saved ? "Paylaşım kaydedildi." : "Paylaşım kaydedilenlerden çıkarıldı.");
    } catch (error) {
      setPost(previous);
      setMessage(error instanceof Error ? error.message : "Kayıt durumu güncellenemedi.");
    } finally {
      setBusy(null);
    }
  }

  async function addToList() {
    if (requireViewer() || post.addedByMe || busy) return;
    setBusy("add");
    try {
      const response = await fetch("/api/feed/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok && !data.alreadyExists) throw new Error(data.error || "Şarkı listene eklenemedi.");
      setPost((current) => ({
        ...current,
        addedByMe: true,
        addCount: current.addCount + (data.alreadyExists ? 0 : 1),
      }));
      setMessage(data.warning || data.message || "Şarkı listene eklendi.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Şarkı listene eklenemedi.");
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setMessage("Paylaşım bağlantısı kopyalandı.");
    } catch {
      setMessage("Bağlantı kopyalanamadı.");
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-14 sm:px-6">
      <Toast message={message} onClose={() => setMessage(null)} />
      <section className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Paylaşım"
          subtitle={`${post.author.ownerName} tarafından paylaşıldı`}
          icon={<Music2 size={18} />}
          backHref={returnTo}
          backLabel="Akışa dön"
          showPrimaryNavigation
          actions={viewer ? (
            <AccountMenu
              ownerName={viewer.ownerName}
              email={viewer.email}
              profileSlug={viewer.slug}
              role={viewer.role}
              onLogout={() => void logoutToHome()}
            />
          ) : (
            <Link href={accountLoginPath(detailPath)} className={buttonClassName({ variant: "primary", size: "sm" })}>
              Giriş yap
            </Link>
          )}
        />

        <div className="post-detail-layout">
          <article className="post-detail-main">
            <header className="post-detail-author-row">
              <Link href={`/u/${post.author.slug}`} className="nav-avatar post-detail-avatar" aria-label={`${post.author.ownerName} profilini aç`}>
                {post.author.ownerName.slice(0, 1).toUpperCase()}
              </Link>
              <div>
                <Link href={`/u/${post.author.slug}`} className="post-detail-author-name">{post.author.ownerName}</Link>
                <time dateTime={post.createdAt}>{dateFormatter.format(new Date(post.createdAt))}</time>
              </div>
              <Button variant="ghost" size="icon" onClick={() => void copyLink()} aria-label="Paylaşım bağlantısını kopyala" title="Bağlantıyı kopyala">
                <Link2 size={18} />
              </Button>
            </header>

            <div className="post-detail-track">
              <span className="post-detail-track-icon" aria-hidden="true"><Music2 size={24} /></span>
              <div className="min-w-0">
                <h1>{post.trackName}</h1>
                <p>{post.artistName}{post.albumName ? ` · ${post.albumName}` : ""}</p>
              </div>
              {post.externalUrl && (
                <a href={post.externalUrl} target="_blank" rel="noreferrer" className={buttonClassName({ variant: "secondary", size: "sm" })}>
                  <ExternalLink size={16} /> Spotify'da aç
                </a>
              )}
            </div>

            {post.note && <p className="post-detail-note">{post.note}</p>}
            {post.tags.length > 0 && (
              <div className="post-detail-tags" aria-label="Paylaşım etiketleri">
                {post.tags.map((tag) => <span key={tag}>#{tag}</span>)}
              </div>
            )}

            <div className="post-detail-actions" aria-label="Paylaşım işlemleri">
              <Button variant={post.likedByMe ? "primary" : "secondary"} loading={busy === "like"} disabled={post.isMine || Boolean(busy)} onClick={() => void toggleLike()} leadingIcon={<Heart size={17} fill={post.likedByMe ? "currentColor" : "none"} />} title={post.isMine ? "Kendi paylaşımını beğenemezsin" : undefined}>
                Beğen <strong>{post.likeCount}</strong>
              </Button>
              <Button variant={post.addedByMe ? "primary" : "secondary"} loading={busy === "add"} disabled={post.addedByMe || Boolean(busy)} onClick={() => void addToList()} leadingIcon={<ListPlus size={18} />}>
                {post.addedByMe ? "Listemde" : "Listeme ekle"} <strong>{post.addCount}</strong>
              </Button>
              <Button variant={post.savedByMe ? "primary" : "secondary"} loading={busy === "save"} disabled={Boolean(busy)} onClick={() => void toggleSave()} leadingIcon={<Bookmark size={17} fill={post.savedByMe ? "currentColor" : "none"} />}>
                {post.savedByMe ? "Kaydedildi" : "Kaydet"}
              </Button>
            </div>
          </article>

          <aside className="post-detail-profile" aria-label="Paylaşan kullanıcı">
            <p className="section-kicker">Paylaşan kişi</p>
            <div className="post-detail-profile-heading">
              <span className={`profile-theme-swatch profile-theme-${post.author.profileTheme}`} aria-hidden="true" />
              <div>
                <Link href={`/u/${post.author.slug}`}>{post.author.ownerName}</Link>
                <p>{post.author.playlistName || "Kişisel liste"}</p>
              </div>
            </div>
            {post.author.bio && <p className="post-detail-profile-bio">{post.author.bio}</p>}
            <dl className="post-detail-profile-stats">
              <div><dt>Paylaşım</dt><dd>{post.author.postCount}</dd></div>
              <div><dt>Takipçi</dt><dd>{post.author.followerCount}</dd></div>
            </dl>
            <Link href={`/u/${post.author.slug}`} className={buttonClassName({ variant: "secondary", size: "md", className: "w-full" })}>
              Profili görüntüle
            </Link>
          </aside>
        </div>
        <PostComments postId={post.id} loginReturnTo={`${detailPath}#comments`} viewer={viewer ? { id: viewer.id, role: viewer.role } : null} onMessage={setMessage} />
      </section>
    </main>
  );
}
