import type { ReactNode } from "react";
import { getProfilePreset } from "@/lib/profileAppearance";
import { Award, CalendarDays, Music2 } from "lucide-react";
import type { Profile } from "@/app/(social)/u/[slug]/profileTypes";

type ProfileHeroV3Props = {
  profile: Profile;
  actions: ReactNode;
  onOpenConnections: (type: "followers" | "following") => void;
};

export function ProfileHeroV3({ profile, actions, onOpenConnections }: ProfileHeroV3Props) {
  const initial = profile.ownerName.slice(0, 1).toLocaleUpperCase("tr-TR");
  const preset = getProfilePreset(profile.profileTheme);

  return (
    <section className={`profile-v3-hero profile-density-${profile.profileDensity} profile-banner-${profile.profileBanner}`}>
      <div className="profile-v3-cover" style={{ background: preset.gradient }} aria-hidden="true">
        <span className="profile-v3-cover-grid" />
        <span className="profile-v3-cover-glow" />
        <Music2 size={44} />
        <div className="profile-v4-record"><span /></div>
      </div>
      <div className="profile-v4-cover-caption"><span>Kişisel müzik vitrini</span><strong>{profile.playlistName || "Her keşif bir iz bırakır."}</strong></div>

      <div className="profile-v3-hero-body">
        <div className="profile-v3-avatar" style={{ background: preset.gradient }} aria-label={`${profile.ownerName} profil görseli`}>
          <span>{initial}</span>
        </div>

        <div className="profile-v3-identity">
          <div className="profile-v3-name-line">
            <h1>{profile.ownerName}</h1>
            {profile.featuredAchievement && (
              <span className="profile-v3-featured-badge" title={profile.featuredAchievement.description}>
                <Award size={14} /> {profile.featuredAchievement.title}
              </span>
            )}
          </div>
          <p className="profile-v3-handle">@{profile.slug}</p>
          <p className="profile-v3-status">{profile.profileStatus || "Yeni müzikler ve iyi sohbetler için burada."}</p>
          <span className="profile-v3-joined"><CalendarDays size={14} /> {new Date(profile.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })} tarihinde katıldı</span>
        </div>

        <div className="profile-v3-actions">{actions}</div>
      </div>

      <div className="profile-v3-summary" aria-label="Profil özeti">
        <button type="button" onClick={() => onOpenConnections("followers")}>
          <strong>{profile.followerCount}</strong><span>takipçi</span>
        </button>
        <button type="button" onClick={() => onOpenConnections("following")}>
          <strong>{profile.followingCount}</strong><span>takip</span>
        </button>
        <span><Music2 size={15} /><strong>{profile.postCount}</strong> paylaşım</span>
        <span className="profile-v4-badge-count"><Award size={15} /><strong>{profile.achievements.length}</strong> rozet</span>
      </div>
    </section>
  );
}
