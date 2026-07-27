import Link from "next/link";
import {
  Award,
  CalendarDays,
  ExternalLink,
  Heart,
  ListPlus,
  Music2,
  Target,
} from "lucide-react";
import type { Profile, ProfileTab } from "@/app/u/[slug]/profileTypes";

type ProfileTabPanelsProps = {
  profile: Profile;
  activeTab: ProfileTab;
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function ProfileTabPanels({ profile, activeTab }: ProfileTabPanelsProps) {
  return (
    <section
      id={`profile-panel-${activeTab}`}
      role="tabpanel"
      aria-labelledby={`profile-tab-${activeTab}`}
      className="mt-5"
    >
      {activeTab === "posts" && (
        <div className="profile-posts-panel">
          <div>
            <p className="section-kicker text-cyan-100/75">Son paylaşımlar</p>
            <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">Müzik keşifleri</h2>
          </div>
          <div className="profile-posts-grid mt-4">
            {profile.posts.map((post) => (
              <article key={post.id} className="profile-post-card">
                <div className="profile-post-main">
                  <span className="profile-post-icon" aria-hidden="true"><Music2 size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <h3>{post.trackName}</h3>
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
                  <span className="profile-badge-mark"><Award size={20} /></span>
                  <div>
                    <h3>{achievement.title}</h3>
                    <p>{achievement.description}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="profile-empty-state mt-4">
              <Award size={21} />
              <h3>Henüz rozet kazanılmadı</h3>
              <p>Paylaşım ve topluluk etkileşimleri arttıkça başarımlar burada açılır.</p>
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
