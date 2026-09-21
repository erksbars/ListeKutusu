import Link from "next/link";
import { profileGamePresentation } from "@/lib/profileGames";
import type { RefObject } from "react";
import {
  Award,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Gamepad2,
  Heart,
  ListPlus,
  MessageCircle,
  MessageSquareText,
  Music2,
  Target,
  Trophy,
} from "lucide-react";
import type { Profile, ProfileTab } from "@/app/(social)/u/[slug]/profileTypes";
import { FeedLoadSentinel } from "@/app/components/FeedLoadSentinel";

type ProfileTabPanelsProps = {
  profile: Profile;
  activeTab: ProfileTab;
  postsLoading: boolean;
  postsError: string | null;
  postsSentinelRef: RefObject<HTMLDivElement>;
  onRetryPosts: () => void;
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const monthFormatter = new Intl.DateTimeFormat("tr-TR", {
  month: "long",
  year: "numeric",
});

function activityGroupLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDifference = Math.floor((startOfToday - startOfDate) / 86_400_000);
  if (dayDifference <= 0) return "Bugün";
  if (dayDifference <= 7) return "Bu hafta";
  return monthFormatter.format(date);
}

export function ProfileTabPanels({
  profile,
  activeTab,
  postsLoading,
  postsError,
  postsSentinelRef,
  onRetryPosts,
}: ProfileTabPanelsProps) {
  const pinnedPost = profile.pinnedFeedPostId
    ? profile.posts.find((post) => post.id === profile.pinnedFeedPostId) ?? null
    : null;
  const featuredPost = pinnedPost ?? profile.posts.reduce<(typeof profile.posts)[number] | null>(
    (best, post) => !best || post.likeCount + post.addCount > best.likeCount + best.addCount ? post : best,
    null
  );
  const activityItems = [
    ...profile.posts.map((post) => ({
      id: `post-${post.id}`,
      type: "post" as const,
      href: `/p/${post.id}`,
      action: "Şarkı paylaştı",
      title: post.trackName,
      detail: `${post.artistName}${post.note ? ` · ${post.note}` : ""}`,
      date: post.createdAt,
      meta: `${post.likeCount} beğeni · ${post.commentCount} yorum`,
    })),
    ...profile.forumThreads.map((thread) => ({
      id: `forum-${thread.id}`,
      type: "forum" as const,
      href: `/forum/${thread.slug}`,
      action: "Forum konusu açtı",
      title: thread.title,
      detail: thread.categoryLabel,
      date: thread.createdAt,
      meta: `${thread.replyCount} yanıt · ${thread.views} görüntülenme`,
    })),
    ...profile.games.map((game) => ({
      id: `game-${game.id}`,
      type: "game" as const,
      href: profileGamePresentation(game.gameCode, game.id).href,
      action: "Oyunu tamamladı",
      title: profileGamePresentation(game.gameCode, game.id).title,
      detail: game.winner
        ? `${game.winner.trackName} · ${game.winner.artistName}`
        : "Karşılaşma tamamlandı",
      date: game.completedAt,
      meta: game.winner ? "Şampiyon parça" : "Tamamlandı",
    })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 12);
  const activityGroups = activityItems.reduce<Array<{ label: string; items: typeof activityItems }>>(
    (groups, item) => {
      const label = activityGroupLabel(item.date);
      const current = groups[groups.length - 1];
      if (current?.label === label) current.items.push(item);
      else groups.push({ label, items: [item] });
      return groups;
    },
    []
  );

  return (
    <section
      id={`profile-panel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`profile-tab-${activeTab}`}
      className="mt-5"
    >
      {activeTab === "posts" && (
        <div className="profile-posts-panel">
          <div className="profile-showcase-grid">
            {profile.showcaseModules.includes("featured") && (
            <section
              className="profile-showcase-module profile-showcase-featured profile-showcase-size-large"
              style={{ order: profile.showcaseModules.indexOf("featured") }}
            >
              <div className="profile-showcase-module-heading">
                <p className="section-kicker">{pinnedPost ? "İmza keşfi" : "Son keşiflerden öne çıkan"}</p>
                <span>Başrol</span>
              </div>
              {featuredPost ? (
                <>
                  <div className="profile-showcase-track">
                    <span className="profile-post-icon" aria-hidden="true"><Music2 size={19} /></span>
                    <div className="min-w-0">
                      <Link href={`/p/${featuredPost.id}`}><h2>{featuredPost.trackName}</h2></Link>
                      <p>{featuredPost.artistName}</p>
                    </div>
                  </div>
                  {featuredPost.note && <p className="profile-showcase-copy">{featuredPost.note}</p>}
                  <div className="profile-showcase-signals">
                    <span><Heart size={14} /> {featuredPost.likeCount} beğeni</span>
                    <span><ListPlus size={14} /> {featuredPost.addCount} ekleme</span>
                    <Link href={`/p/${featuredPost.id}#comments`}><MessageCircle size={14} /> {featuredPost.commentCount} yorum</Link>
                  </div>
                </>
              ) : (
                <p className="profile-showcase-empty">Henüz öne çıkarılacak bir keşif yok.</p>
              )}
            </section>
            )}
            {profile.showcaseModules.includes("identity") && (
            <section
              className="profile-showcase-module profile-showcase-identity profile-showcase-size-compact"
              style={{ order: profile.showcaseModules.indexOf("identity") }}
            >
              <p className="section-kicker">Müzik kimliği</p>
              <h2>{profile.playlistName || `${profile.ownerName} seçkisi`}</h2>
              <p className="profile-showcase-copy">
                {profile.favoriteGenres.length > 0
                  ? `${profile.favoriteGenres.length} favori tür ve ${profile.postCount} keşifle şekillenen kişisel seçki.`
                  : "Paylaşımlar bu profilin zamanla gelişen müzik haritasını oluşturuyor."}
              </p>
              {profile.favoriteGenres.length > 0 ? (
                <div className="profile-showcase-genres">
                  {profile.favoriteGenres.slice(0, 6).map((genre) => <span key={genre}>{genre}</span>)}
                </div>
              ) : profile.isMe ? (
                <Link href="/account?tab=profile" className="profile-showcase-setup">Müzik türlerini ekle</Link>
              ) : null}
            </section>
            )}
            {profile.showcaseModules.includes("recent") && (
            <section
              className="profile-showcase-recent profile-showcase-size-wide"
              style={{ order: profile.showcaseModules.indexOf("recent") }}
            >
          <div>
            <p className="section-kicker text-cyan-100/75">Aktivite</p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Son paylaşımlar</h2>
          </div>
          <div className="profile-posts-grid mt-4">
            {profile.posts.map((post) => (
              <article key={post.id} className="profile-post-card">
                <div className="profile-post-main">
                  <span className="profile-post-icon" aria-hidden="true"><Music2 size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <h3><Link href={`/p/${post.id}`}>{post.trackName}</Link></h3>
                    <p>{post.artistName}{post.albumName ? ` · ${post.albumName}` : ""}</p>
                  </div>
                  {post.externalUrl && (
                    <a
                      href={post.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="profile-post-open"
                      aria-label={`${post.trackName} Spotify'da aç`}
                      title="Spotify'da aç"
                    >
                      <ExternalLink size={15} />
                    </a>
                  )}
                </div>
                {post.note && <p className="profile-post-note">{post.note}</p>}
                <div className="profile-post-footer">
                  <span className="profile-post-signal"><Heart size={13} /> {post.likeCount}</span>
                  <span className="profile-post-signal"><ListPlus size={13} /> {post.addCount}</span>
                  <Link href={`/p/${post.id}#comments`} className="profile-post-signal"><MessageCircle size={13} /> {post.commentCount}</Link>
                  <time dateTime={post.createdAt}>{dateFormatter.format(new Date(post.createdAt))}</time>
                  {post.tags.map((tag) => (
                    <span key={`${post.id}-${tag}`} className="profile-meta-pill">#{tag}</span>
                  ))}
                </div>
              </article>
            ))}
            {profile.posts.length === 0 && (
              <div className="profile-empty-state">
                <Music2 size={21} />
                <h3>Henüz paylaşım yok</h3>
                <p>Bu kullanıcının akışa bıraktığı şarkılar burada görünecek.</p>
                {profile.isMe && (
                  <Link href="/#feed-composer" className="primary-action mt-4 h-10 rounded-xl px-4 text-xs font-bold">
                    İlk şarkını paylaş
                  </Link>
                )}
              </div>
            )}
          </div>
          {profile.posts.length > 0 && (profile.nextPostCursor || postsLoading || postsError) && (
            <FeedLoadSentinel
              sentinelRef={postsSentinelRef}
              loading={postsLoading}
              error={postsError}
              onRetry={onRetryPosts}
              loadingLabel="Paylaşımlar yükleniyor..."
            />
          )}
            </section>
            )}
            {profile.showcaseModules.includes("forum") && (
              <section
                className="profile-showcase-module profile-showcase-forum profile-showcase-size-list"
                style={{ order: profile.showcaseModules.indexOf("forum") }}
              >
                <div className="profile-showcase-forum-heading">
                  <div>
                    <p className="section-kicker">Forum katkıları</p>
                    <h2>Topluluktaki son konular</h2>
                  </div>
                  <Link href="/forum">Foruma git</Link>
                </div>
                {profile.forumThreads.length > 0 ? (
                  <div className="profile-showcase-forum-list">
                    {profile.forumThreads.map((thread) => (
                      <Link key={thread.id} href={`/forum/${thread.slug}`} className="profile-showcase-forum-row">
                        <span className="profile-post-icon" aria-hidden="true"><MessageSquareText size={17} /></span>
                        <span className="min-w-0">
                          <strong>{thread.title}</strong>
                          <small>{thread.categoryLabel} · {thread.replyCount} yanıt · {thread.views} görüntülenme</small>
                        </span>
                        {thread.solved && <CheckCircle2 size={17} className="profile-showcase-forum-solved" aria-label="Çözüldü" />}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="profile-showcase-forum-empty">
                    <p>Henüz yayınlanmış bir forum konusu yok.</p>
                    {profile.isMe && <Link href="/forum/new">İlk konunu aç</Link>}
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      )}

      {activeTab === "about" && (
        <div className="profile-detail-grid">
          <section className="profile-detail-card">
            <p className="section-kicker">Profil özeti</p>
            <h2>{profile.playlistName || "Müzik keşifleri"}</h2>
            <p className="profile-detail-copy">{profile.bio || "Bu kullanıcı henüz profil açıklaması eklemedi."}</p>
            <div className="mt-5 grid gap-2">
              <div className="profile-about-row"><Heart size={16} /><span>{profile.totalLikes} beğeni aldı</span></div>
              <div className="profile-about-row"><ListPlus size={16} /><span>{profile.totalAdds} kez listeye eklendi</span></div>
              <div className="profile-about-row">
                <CalendarDays size={16} />
                <span>{new Date(profile.createdAt).toLocaleDateString("tr-TR")} tarihinde katıldı</span>
              </div>
            </div>
          </section>
          <section className="profile-detail-card">
            <p className="section-kicker">Favori türler</p>
            <h2>Müzik haritası</h2>
            {profile.favoriteGenres.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.favoriteGenres.map((genre) => (
                  <span key={genre} className="profile-genre-pill">{genre}</span>
                ))}
              </div>
            ) : (
              <p className="profile-detail-copy">Henüz favori müzik türü belirtilmedi.</p>
            )}
            {profile.isMe && (
              <Link href="/account?tab=profile" className="secondary-action mt-5 h-10 rounded-xl px-4 text-xs font-bold">
                Profili düzenle
              </Link>
            )}
          </section>
          <section className="profile-detail-card profile-game-history-card">
            <div className="profile-detail-heading-row">
              <div>
                <p className="section-kicker">Oyun geçmişi</p>
                <h2>Son karşılaşmalar</h2>
              </div>
              <Gamepad2 size={20} aria-hidden="true" />
            </div>
            {profile.games.length > 0 ? (
              <div className="profile-game-history-list">
                {profile.games.slice(0, 4).map((game) => (
                  <Link key={game.id} href={profileGamePresentation(game.gameCode, game.id).href} className="profile-game-history-row">
                    <span className="profile-game-history-mark"><Trophy size={15} /></span>
                    <span className="min-w-0">
                      <strong>{profileGamePresentation(game.gameCode, game.id).title}</strong>
                      <small>{game.winner ? `${game.winner.trackName} · ${game.winner.artistName}` : "Karşılaşma tamamlandı"}</small>
                    </span>
                    <time dateTime={game.completedAt}>{dateFormatter.format(new Date(game.completedAt))}</time>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="profile-detail-empty">
                <p className="profile-detail-copy">Tamamlanan oyunlar burada kişisel geçmişe dönüşecek.</p>
                {profile.isMe && <Link href="/games" className="profile-inline-action">Oyunları keşfet</Link>}
              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="profile-activity-panel">
          <div className="profile-activity-heading">
            <div>
              <p className="section-kicker">Topluluk geçmişi</p>
              <h2>Son aktiviteler</h2>
            </div>
            <span>{activityItems.length} hareket</span>
          </div>
          <div className="profile-activity-summary" aria-label="Aktivite özeti">
            <span><Music2 size={16} /><strong>{profile.postCount}</strong><small>paylaşım</small></span>
            <span><MessageSquareText size={16} /><strong>{profile.forumThreadCount}</strong><small>forum konusu</small></span>
            <span><Gamepad2 size={16} /><strong>{profile.completedGameCount}</strong><small>{profile.isMe ? "oyun" : "açık oyun"}</small></span>
          </div>
          {activityItems.length > 0 ? (
            <div className="profile-activity-groups">
              {activityGroups.map((group) => (
                <section key={group.label} className="profile-activity-group" aria-labelledby={`activity-group-${group.label.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-")}`}>
                  <h3 id={`activity-group-${group.label.toLocaleLowerCase("tr-TR").replace(/\s+/g, "-")}`}>{group.label}</h3>
                  <div className="profile-activity-list">
                    {group.items.map((item) => (
                      <Link key={item.id} href={item.href} className="profile-activity-row">
                        <span className={`profile-activity-icon profile-activity-icon-${item.type}`} aria-hidden="true">
                          {item.type === "post"
                            ? <Music2 size={17} />
                            : item.type === "forum"
                              ? <MessageSquareText size={17} />
                              : <Trophy size={17} />}
                        </span>
                        <span className="min-w-0 profile-activity-copy">
                          <em>{item.action}</em>
                          <strong>{item.title}</strong>
                          <small>{item.detail}</small>
                        </span>
                        <span className="profile-activity-meta">
                          <small>{item.meta}</small>
                          <time dateTime={item.date}>{dateFormatter.format(new Date(item.date))}</time>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="profile-empty-state">
              <Gamepad2 size={21} />
              <h3>Henüz aktivite yok</h3>
              <p>Şarkı paylaşımları, forum konuları ve tamamlanan oyunlar burada birlikte görünecek.</p>
              <div className="profile-empty-actions">
                {profile.isMe ? (
                  <>
                    <Link href="/#feed-composer" className="primary-action">Şarkı paylaş</Link>
                    <Link href="/forum/new" className="secondary-action">Konu aç</Link>
                  </>
                ) : (
                  <Link href="/discover" className="secondary-action">Keşfe dön</Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="profile-posts-panel">
          <div>
            <p className="section-kicker text-cyan-100/75">Topluluk ilerlemesi</p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Kazanılan rozetler</h2>
          </div>
          {profile.achievements.length > 0 ? (
            <div className="profile-badge-grid mt-4">
              {profile.achievements.map((achievement) => (
                <article key={achievement.id} className="profile-badge-card">
                  <span className="profile-badge-mark"><Award size={22} /></span>
                  <div>
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                    <span className="profile-badge-earned"><CheckCircle2 size={13} /> Koleksiyona eklendi</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="profile-empty-state mt-4">
              <Award size={21} />
              <h3>Henüz rozet kazanılmadı</h3>
              <p>Paylaşım ve topluluk etkileşimleri arttıkça başarımlar burada açılır.</p>
              {profile.isMe && (
                <div className="profile-empty-actions">
                  <Link href="/discover" className="primary-action">Keşfetmeye başla</Link>
                </div>
              )}
            </div>
          )}
          {profile.isMe && profile.nextAchievement && (
            <section className="profile-next-badge mt-4">
              <div className="flex items-center justify-between gap-3">
                <span className="profile-next-badge-title">
                  <Target size={16} />
                  <span className="truncate">{profile.nextAchievement.title}</span>
                </span>
                <span className="profile-next-badge-count">
                  {profile.nextAchievement.current}/{profile.nextAchievement.target}
                </span>
              </div>
              <p className="profile-next-badge-copy">{profile.nextAchievement.description}</p>
              <div className="profile-next-badge-progress">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
                  style={{ width: `${profile.nextAchievement.progress}%` }}
                />
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}
