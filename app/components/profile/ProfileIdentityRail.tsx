import Link from "next/link";
import { CalendarDays, Gamepad2, Headphones, Heart, ListPlus, MessageSquareText, Settings2, Sparkles, UsersRound } from "lucide-react";
import type { Profile } from "@/app/u/[slug]/profileTypes";

export function ProfileIdentityRail({ profile }: { profile: Profile }) {
  return (
    <aside className="profile-v3-rail" aria-label="Profil bilgileri">
      <section className="profile-v3-rail-card">
        <p className="section-kicker">Hakkında</p>
        <p className="profile-v3-about-copy">{profile.bio || "Bu müziksever henüz kendini anlatan kısa bir not eklemedi."}</p>
        <div className="profile-v3-rail-meta">
          <span><CalendarDays size={15} /> {new Date(profile.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span><Headphones size={15} /> {profile.playlistName || `${profile.ownerName} seçkisi`}</span>
        </div>
        {profile.isMe && (
          <Link href="/account?tab=profile" className="profile-v3-edit-link"><Settings2 size={16} /> Profili düzenle</Link>
        )}
      </section>

      <section className="profile-v3-rail-card">
        <p className="section-kicker">Müzik kimliği</p>
        {profile.favoriteGenres.length ? (
          <div className="profile-v3-genres">
            {profile.favoriteGenres.slice(0, 8).map((genre) => <span key={genre}>#{genre}</span>)}
          </div>
        ) : (
          <p className="profile-v3-muted">Favori türler henüz eklenmedi.</p>
        )}
        {!profile.isMe && profile.sharedGenres.length > 0 && (
          <div className="profile-v3-shared-taste">
            <span><Sparkles size={14} /> Ortak zevkiniz</span>
            <strong>{profile.sharedGenres.slice(0, 3).join(" · ")}</strong>
          </div>
        )}
      </section>

      <section className="profile-v3-rail-card profile-v3-discovery-card">
          <div className="profile-v3-rail-heading">
            <div>
              <p className="section-kicker">Keşfet</p>
              <h2>Benzer müzikseverler</h2>
            </div>
            {profile.favoriteGenres[0] ? (
              <Link
                href={`/discover?q=${encodeURIComponent(profile.favoriteGenres[0])}&type=people`}
                className="profile-v3-rail-more"
              >
                Tümünü gör
              </Link>
            ) : <UsersRound size={18} />}
          </div>
          {profile.relatedProfiles.length > 0 ? (
            <div className="profile-v3-related-list">
              {profile.relatedProfiles.map((related) => (
                <Link key={related.id} href={`/u/${related.slug}`} className="profile-v3-related-user">
                  <span className="profile-v3-related-avatar">
                    {related.ownerName.slice(0, 1).toLocaleUpperCase("tr-TR")}
                  </span>
                  <span className="profile-v3-related-copy">
                    <strong>{related.ownerName}</strong>
                    <small>{related.sharedGenres.slice(0, 2).join(" · ")}</small>
                    <em>{related.sharedGenres.length} ortak tür · {related.postCount} keşif</em>
                  </span>
                  <span className="profile-v3-related-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="profile-v3-discovery-empty">
              <UsersRound size={18} />
              <p>{profile.favoriteGenres.length < 3
                ? "En az üç favori tür, benzer profilleri bulmayı kolaylaştırır."
                : "Bu müzik kimliğiyle eşleşen yeni profiller henüz oluşmadı."}</p>
              {profile.isMe ? (
                <Link href="/account?tab=profile">Müzik kimliğini tamamla</Link>
              ) : (
                <Link href="/discover?type=people">İnsanları keşfet</Link>
              )}
            </div>
          )}
        </section>

      <section className="profile-v3-rail-card">
        <p className="section-kicker">Topluluk izi</p>
        <div className="profile-v3-community-list">
          <span><ListPlus size={16} /><b>{profile.totalAdds}</b> listeye eklenme</span>
          <span><Heart size={16} /><b>{profile.totalLikes}</b> alınan beğeni</span>
          <span><MessageSquareText size={16} /><b>{profile.forumThreads.length}</b> son forum katkısı</span>
          <span><Gamepad2 size={16} /><b>{profile.games.length}</b> tamamlanan oyun</span>
          <span><Sparkles size={16} /><b>{profile.achievements.length}</b> açılan rozet</span>
        </div>
      </section>
    </aside>
  );
}
