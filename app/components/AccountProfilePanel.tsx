"use client";

import Link from "next/link";
import { KeyboardEvent as ReactKeyboardEvent, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Award,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  LayoutDashboard,
  Music2,
  Palette,
  Save,
  UserRound,
} from "lucide-react";
import {
  PROFILE_SHOWCASE_MODULES,
  type ProfileShowcaseModule,
} from "@/lib/profileShowcase";
import type { ProfileBanner, ProfileDensity } from "@/lib/profileAppearance";

const PROFILE_THEMES = [
  ["aurora", "Aurora", "from-cyan-400 via-blue-500 to-violet-500"],
  ["violet", "Mor", "from-fuchsia-400 via-violet-500 to-indigo-500"],
  ["emerald", "Zümrüt", "from-emerald-300 via-teal-500 to-cyan-500"],
  ["sunset", "Gün batımı", "from-rose-400 via-orange-400 to-violet-500"],
] as const;

const PROFILE_PREVIEW_GRADIENTS: Record<string, string> = {
  aurora: "linear-gradient(110deg, var(--ui-primary), var(--ui-info) 52%, var(--ui-secondary))",
  violet: "linear-gradient(110deg, var(--ui-danger), var(--ui-secondary) 52%, var(--ui-info))",
  emerald: "linear-gradient(110deg, var(--ui-success), var(--ui-accent) 52%, var(--ui-primary))",
  sunset: "linear-gradient(110deg, var(--ui-danger), var(--ui-warning) 52%, var(--ui-secondary))",
};

const SHOWCASE_LABELS: Record<ProfileShowcaseModule, { title: string; description: string }> = {
  featured: { title: "Öne çıkan keşif", description: "Sabitlediğin veya en çok etkileşim alan paylaşım." },
  identity: { title: "Müzik kimliği", description: "Profil açıklaman, seçkin ve favori türlerin." },
  recent: { title: "Son paylaşımlar", description: "Profilindeki güncel şarkı akışı." },
  forum: { title: "Forum katkıları", description: "Toplulukta açtığın son onaylı konular." },
};

const EDITOR_SECTIONS = [
  ["identity", "Kimlik", UserRound],
  ["music", "Müzik", Music2],
  ["showcase", "Vitrin", LayoutDashboard],
  ["appearance", "Görünüm", Palette],
] as const;

const DENSITY_OPTIONS: Array<{ value: ProfileDensity; label: string; description: string }> = [
  { value: "comfortable", label: "Rahat", description: "Daha geniş boşluklar" },
  { value: "compact", label: "Kompakt", description: "Daha yoğun profil" },
];

const BANNER_OPTIONS: Array<{ value: ProfileBanner; label: string; description: string }> = [
  { value: "line", label: "İnce çizgi", description: "Sade vurgu" },
  { value: "band", label: "Renk bandı", description: "Güçlü kimlik" },
  { value: "split", label: "Bölünmüş", description: "Dengeli vurgu" },
];

type EditorSection = (typeof EDITOR_SECTIONS)[number][0];

type AccountProfilePanelProps = {
  ownerName: string;
  slug: string;
  bio: string;
  status: string;
  pinnedPostId: string;
  showcaseModules: ProfileShowcaseModule[];
  posts: Array<{ id: string; trackName: string; artistName: string }>;
  genres: string;
  theme: string;
  density: ProfileDensity;
  banner: ProfileBanner;
  featuredAchievementId: string;
  achievements: Array<{ id: string; title: string; description: string }>;
  dirty: boolean;
  loading: boolean;
  onBioChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPinnedPostChange: (value: string) => void;
  onShowcaseModulesChange: (value: ProfileShowcaseModule[]) => void;
  onGenresChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onDensityChange: (value: ProfileDensity) => void;
  onBannerChange: (value: ProfileBanner) => void;
  onFeaturedAchievementChange: (value: string) => void;
  onSave: () => void;
};

export function AccountProfilePanel({
  ownerName,
  slug,
  bio,
  status,
  pinnedPostId,
  showcaseModules,
  posts,
  genres,
  theme,
  density,
  banner,
  featuredAchievementId,
  achievements,
  dirty,
  loading,
  onBioChange,
  onStatusChange,
  onPinnedPostChange,
  onShowcaseModulesChange,
  onGenresChange,
  onThemeChange,
  onDensityChange,
  onBannerChange,
  onFeaturedAchievementChange,
  onSave,
}: AccountProfilePanelProps) {
  const [activeSection, setActiveSection] = useState<EditorSection>("identity");
  const hiddenModules = PROFILE_SHOWCASE_MODULES.filter((module) => !showcaseModules.includes(module));
  const orderedModules = [...showcaseModules, ...hiddenModules];
  const featuredPreview = posts.find((post) => post.id === pinnedPostId) ?? posts[0] ?? null;
  const previewGenres = genres.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const featuredAchievement = achievements.find((item) => item.id === featuredAchievementId) ?? null;
  const completionItems = [
    { label: "Kısa durum", complete: status.trim().length >= 8, weight: 20, section: "identity" as EditorSection },
    { label: "Profil açıklaması", complete: bio.trim().length >= 30, weight: 30, section: "identity" as EditorSection },
    { label: "Müzik türleri", complete: previewGenres.length >= 3, weight: 25, section: "music" as EditorSection },
    { label: "Profil vitrini", complete: showcaseModules.length >= 3, weight: 15, section: "showcase" as EditorSection },
    { label: "Öne çıkan içerik", complete: Boolean(pinnedPostId || featuredAchievementId), weight: 10, section: pinnedPostId ? "showcase" as EditorSection : "music" as EditorSection },
  ];
  const completion = completionItems.reduce((total, item) => total + (item.complete ? item.weight : 0), 0);
  const sectionComplete: Record<EditorSection, boolean> = {
    identity: status.trim().length >= 8 && bio.trim().length >= 30,
    music: previewGenres.length >= 3,
    showcase: showcaseModules.length >= 3 && Boolean(pinnedPostId || posts.length),
    appearance: Boolean(theme && density && banner),
  };
  const activeSectionIndex = EDITOR_SECTIONS.findIndex(([value]) => value === activeSection);
  const previousSection = activeSectionIndex > 0 ? EDITOR_SECTIONS[activeSectionIndex - 1] : null;
  const nextSection = activeSectionIndex < EDITOR_SECTIONS.length - 1 ? EDITOR_SECTIONS[activeSectionIndex + 1] : null;

  useEffect(() => {
    if (!dirty) return;
    const preventUnsavedExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", preventUnsavedExit);
    return () => window.removeEventListener("beforeunload", preventUnsavedExit);
  }, [dirty]);

  function toggleModule(module: ProfileShowcaseModule) {
    if (showcaseModules.includes(module)) {
      if (showcaseModules.length === 1) return;
      onShowcaseModulesChange(showcaseModules.filter((item) => item !== module));
      return;
    }
    onShowcaseModulesChange([...showcaseModules, module]);
  }

  function moveModule(module: ProfileShowcaseModule, direction: -1 | 1) {
    const index = showcaseModules.indexOf(module);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= showcaseModules.length) return;
    const next = [...showcaseModules];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    onShowcaseModulesChange(next);
  }

  function handleSectionKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>, current: EditorSection) {
    const currentIndex = EDITOR_SECTIONS.findIndex(([value]) => value === current);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % EDITOR_SECTIONS.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + EDITOR_SECTIONS.length) % EDITOR_SECTIONS.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = EDITOR_SECTIONS.length - 1;
    else return;
    event.preventDefault();
    const nextSection = EDITOR_SECTIONS[nextIndex][0];
    setActiveSection(nextSection);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`#profile-editor-tab-${nextSection}`)
      ?.focus();
  }

  return (
    <div className="account-profile-editor-shell">
      <section className="account-content-panel account-profile-editor-main">
        <div className="account-profile-editor-heading">
          <div>
            <h2 className="section-kicker">Profil düzenleyici</h2>
            <p>Sosyal kimliğini, vitrinini ve görünümünü tek yerden yönet.</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {dirty && <span className="unsaved-badge">Kaydedilmedi</span>}
            <Link
              href={`/u/${slug}`}
              className="account-profile-open-link"
              onClick={(event) => {
                if (dirty && !window.confirm("Kaydedilmemiş değişikliklerin var. Profili yine de açmak istiyor musun?")) {
                  event.preventDefault();
                }
              }}
            >
              <span>Profili aç</span> <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        <nav className="profile-editor-tabs" role="tablist" aria-label="Profil düzenleme bölümleri">
          {EDITOR_SECTIONS.map(([value, label, Icon]) => (
            <button
              key={value}
              id={`profile-editor-tab-${value}`}
              type="button"
              role="tab"
              aria-selected={activeSection === value}
              aria-controls={`profile-editor-panel-${value}`}
              tabIndex={activeSection === value ? 0 : -1}
              onKeyDown={(event) => handleSectionKeyDown(event, value)}
              onClick={() => setActiveSection(value)}
              className={activeSection === value ? "profile-editor-tab is-active" : "profile-editor-tab"}
            >
              <Icon size={16} />
              <span>{label}</span>
              {sectionComplete[value] && <CheckCircle2 size={13} className="profile-editor-tab-check" aria-label="Tamamlandı" />}
            </button>
          ))}
        </nav>

        <div className="profile-editor-step-summary" aria-live="polite">
          <span>{activeSectionIndex + 1}/{EDITOR_SECTIONS.length}</span>
          <p>
            {activeSection === "identity" && "Profilinde görünen temel bilgileri düzenliyorsun."}
            {activeSection === "music" && "Müzik zevkini ve öne çıkan başarımını seçiyorsun."}
            {activeSection === "showcase" && "Profil vitrininin içeriğini ve sırasını belirliyorsun."}
            {activeSection === "appearance" && "Profilinin renk, yoğunluk ve banner görünümünü seçiyorsun."}
          </p>
        </div>

        <div
          id={`profile-editor-panel-${activeSection}`}
          role="tabpanel"
          aria-labelledby={`profile-editor-tab-${activeSection}`}
          className="profile-editor-panel"
        >
          {activeSection === "identity" && (
            <div className="profile-editor-fields">
              <div>
                <h3>Profil kimliği</h3>
                <p>İnsanların profilinde ilk okuyacağı kısa ve anlaşılır bilgileri düzenle.</p>
              </div>
              <label htmlFor="profile-status" className="form-label">Kısa durum</label>
              <input
                id="profile-status"
                type="text"
                value={status}
                maxLength={80}
                onChange={(event) => onStatusChange(event.target.value)}
                placeholder="Şu sıralar ne dinliyorsun?"
                className="ghost-input h-11 w-full rounded-xl px-4 text-sm outline-none transition"
              />
              <div className="profile-editor-counter">{status.length}/80</div>

              <label htmlFor="profile-bio" className="form-label">Profil açıklaması</label>
              <textarea
                id="profile-bio"
                value={bio}
                onChange={(event) => onBioChange(event.target.value.slice(0, 240))}
                rows={5}
                maxLength={240}
                placeholder="Müzik zevkini birkaç cümleyle anlat..."
                className="ghost-input w-full resize-none rounded-xl px-4 py-3 text-sm leading-6 outline-none transition"
              />
              <div className="profile-editor-counter">{bio.length}/240</div>

            </div>
          )}

          {activeSection === "music" && (
            <div className="profile-editor-fields">
              <div>
                <h3>Müzik kimliği</h3>
                <p>Keşif önerilerinde ve profil eşleşmelerinde kullanılacak müzik sinyallerini düzenle.</p>
              </div>
              <label htmlFor="profile-genres" className="form-label">Favori müzik türleri</label>
              <input
                id="profile-genres"
                type="text"
                value={genres}
                onChange={(event) => onGenresChange(event.target.value)}
                placeholder="Rock, caz, elektronik"
                className="ghost-input h-11 w-full rounded-xl px-4 text-sm outline-none transition"
              />
              <div className="profile-editor-genre-preview" aria-label="Profilinde görünecek türler">
                {previewGenres.length > 0 ? previewGenres.map((genre) => <span key={genre}>{genre}</span>) : <p>Henüz tür eklenmedi.</p>}
              </div>
              <p className="profile-editor-help">Virgülle ayır; en fazla 6 tür profilinde gösterilir. En az 3 tür daha iyi keşif önerileri sağlar.</p>
              <label htmlFor="profile-featured-achievement" className="form-label">Öne çıkan rozet</label>
              <select
                id="profile-featured-achievement"
                value={featuredAchievementId}
                onChange={(event) => onFeaturedAchievementChange(event.target.value)}
                className="ghost-input h-11 w-full rounded-xl px-4 text-sm outline-none transition"
              >
                <option value="">Rozet gösterme</option>
                {achievements.map((achievement) => (
                  <option key={achievement.id} value={achievement.id}>{achievement.title}</option>
                ))}
              </select>
              <p className="profile-editor-help">
                {achievements.length > 0 ? "Yalnızca kazandığın rozetler seçilebilir." : "Henüz öne çıkarabileceğin bir rozet kazanmadın."}
              </p>
            </div>
          )}

          {activeSection === "showcase" && (
            <div className="profile-editor-fields">
              <div>
                <h3>Vitrin düzeni</h3>
                <p>Profil modüllerini göster, gizle veya sırasını değiştir.</p>
              </div>
              <label htmlFor="profile-pinned-post" className="form-label">Sabitlenen keşif</label>
              <select
                id="profile-pinned-post"
                value={pinnedPostId}
                onChange={(event) => onPinnedPostChange(event.target.value)}
                className="ghost-input h-11 w-full rounded-xl px-4 text-sm outline-none transition"
              >
                <option value="">Otomatik seç</option>
                {posts.map((post) => <option key={post.id} value={post.id}>{post.trackName} - {post.artistName}</option>)}
              </select>
              <p className="profile-editor-help">Seçmezsen en çok etkileşim alan paylaşımın öne çıkarılır.</p>

              <div className="profile-showcase-editor-list">
                {orderedModules.map((module) => {
                  const visible = showcaseModules.includes(module);
                  const index = showcaseModules.indexOf(module);
                  return (
                    <div key={module} className={`profile-showcase-editor-row ${visible ? "is-visible" : "is-hidden"}`}>
                      <GripVertical size={17} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <strong>{SHOWCASE_LABELS[module].title}</strong>
                        <span>{SHOWCASE_LABELS[module].description}</span>
                      </div>
                      {visible && (
                        <div className="profile-showcase-order-actions">
                          <button type="button" onClick={() => moveModule(module, -1)} disabled={index === 0} aria-label={`${SHOWCASE_LABELS[module].title} modülünü yukarı taşı`} title="Yukarı taşı"><ChevronUp size={16} /></button>
                          <button type="button" onClick={() => moveModule(module, 1)} disabled={index === showcaseModules.length - 1} aria-label={`${SHOWCASE_LABELS[module].title} modülünü aşağı taşı`} title="Aşağı taşı"><ChevronDown size={16} /></button>
                        </div>
                      )}
                      <button
                        type="button"
                        className="profile-showcase-visibility"
                        onClick={() => toggleModule(module)}
                        disabled={visible && showcaseModules.length === 1}
                        aria-label={`${SHOWCASE_LABELS[module].title} modülünü ${visible ? "gizle" : "göster"}`}
                        title={visible ? "Gizle" : "Göster"}
                      >
                        {visible ? <Eye size={17} /> : <EyeOff size={17} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeSection === "appearance" && (
            <div className="profile-editor-fields">
              <div>
                <h3>Profil görünümü</h3>
                <p>Okunabilirliği koruyan küratörlü renklerden profilinin vurgusunu seç.</p>
              </div>
              <p className="form-label">Profil rengi</p>
              <div className="profile-theme-options" aria-label="Profil rengi">
                {PROFILE_THEMES.map(([value, label, gradient]) => (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    aria-label={label}
                    aria-pressed={theme === value}
                    onClick={() => onThemeChange(value)}
                    className={theme === value ? "profile-theme-option is-active" : "profile-theme-option"}
                  >
                    <span className={`bg-gradient-to-br ${gradient}`} />
                    <strong>{label}</strong>
                    <small>{theme === value ? "Seçili" : "Uygula"}</small>
                  </button>
                ))}
              </div>
              <div className="profile-appearance-note">
                <Palette size={18} />
                <p>Tüm seçenekler açık ve koyu temada kontrastı korunacak şekilde hazırlanmıştır.</p>
              </div>
              <div className="profile-appearance-control">
                <div>
                  <p className="form-label">İçerik yoğunluğu</p>
                  <span>Profilindeki boşluk ve kart ritmini belirler.</span>
                </div>
                <div className="profile-option-segments" role="group" aria-label="Profil içerik yoğunluğu">
                  {DENSITY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={density === option.value}
                      onClick={() => onDensityChange(option.value)}
                      className={density === option.value ? "is-active" : ""}
                    >
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="profile-appearance-control">
                <div>
                  <p className="form-label">Banner düzeni</p>
                  <span>Profil üst alanındaki renk vurgusunu seç.</span>
                </div>
                <div className="profile-option-segments profile-option-segments-three" role="group" aria-label="Profil banner düzeni">
                  {BANNER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={banner === option.value}
                      onClick={() => onBannerChange(option.value)}
                      className={banner === option.value ? "is-active" : ""}
                    >
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-editor-step-actions">
          <button
            type="button"
            className="secondary-action"
            disabled={!previousSection}
            onClick={() => previousSection && setActiveSection(previousSection[0])}
          >
            <ChevronLeft size={16} />
            <span>{previousSection ? previousSection[1] : "İlk adım"}</span>
          </button>
          <span>{activeSectionIndex + 1}. adım</span>
          {nextSection ? (
            <button type="button" className="primary-action" onClick={() => setActiveSection(nextSection[0])}>
              <span>{nextSection[1]}</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button type="button" className="primary-action" onClick={onSave} disabled={loading || !dirty}>
              <Save size={16} />
              <span>{loading ? "Kaydediliyor..." : "Profili kaydet"}</span>
            </button>
          )}
        </div>
      </section>

      <aside className="account-profile-preview-column">
        <section className={`profile-live-preview profile-density-${density} profile-banner-${banner}`} aria-label="Profil vitrini önizlemesi">
          <div className="profile-live-preview-accent" style={{ background: PROFILE_PREVIEW_GRADIENTS[theme] ?? PROFILE_PREVIEW_GRADIENTS.aurora }}>
            <span aria-hidden="true" />
            <Music2 size={24} aria-hidden="true" />
          </div>
          <div className="profile-live-preview-header">
            <span
              className="profile-live-preview-avatar"
              style={{ background: PROFILE_PREVIEW_GRADIENTS[theme] ?? PROFILE_PREVIEW_GRADIENTS.aurora }}
            >
              {ownerName.slice(0, 1).toLocaleUpperCase("tr-TR")}
            </span>
            <div className="min-w-0">
              <span className="profile-live-preview-label">Canlı önizleme</span>
              <strong>{ownerName}</strong>
              <span className="profile-live-preview-handle">@{slug}</span>
              <p>{status || "Kısa durumun burada görünecek."}</p>
              {featuredAchievement && (
                <span className="profile-live-preview-badge"><Award size={12} /> {featuredAchievement.title}</span>
              )}
            </div>
          </div>
          <div className="profile-live-preview-signals" aria-label="Önizleme özeti">
            <span><strong>{previewGenres.length}</strong> tür</span>
            <span><strong>{showcaseModules.length}</strong> vitrin</span>
            <span><strong>{posts.length}</strong> paylaşım</span>
          </div>
          <div className="profile-live-preview-modules">
            {showcaseModules.map((module) => (
              <div key={module} className="profile-live-preview-module">
                <span>{SHOWCASE_LABELS[module].title}</span>
                {module === "featured" && <strong>{featuredPreview ? `${featuredPreview.trackName} · ${featuredPreview.artistName}` : "İlk keşfini paylaş"}</strong>}
                {module === "identity" && <strong>{previewGenres.length ? previewGenres.join(" · ") : "Müzik türlerini ekle"}</strong>}
                {module === "recent" && <strong>{posts.length} paylaşım vitrinde</strong>}
                {module === "forum" && <strong>Topluluktaki son konuların</strong>}
              </div>
            ))}
          </div>
        </section>
        <div className="account-profile-save-panel">
          <div className="profile-completion-heading">
            <div>
              <span>Profil tamamlanma</span>
              <strong>%{completion}</strong>
            </div>
            {completion === 100 && <CheckCircle2 size={18} aria-label="Profil tamamlandı" />}
          </div>
          <div className="profile-completion-track" aria-label={`Profil yüzde ${completion} tamamlandı`}>
            <span style={{ width: `${completion}%` }} />
          </div>
          <div className="profile-completion-list">
            {completionItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={item.complete ? "is-complete" : ""}
                onClick={() => setActiveSection(item.section)}
                title={`${item.label} bölümünü aç`}
              >
                <CheckCircle2 size={13} /> {item.label}
              </button>
            ))}
          </div>
          <div className="profile-save-status">
            <strong>{dirty ? "Değişiklikler yayına hazır" : "Profil güncel"}</strong>
            <p>{dirty ? "Önizlemeyi kontrol edip profilini güncelle." : "Yeni bir düzenleme yaptığında kaydetme düğmesi etkinleşir."}</p>
          </div>
          <button type="button" onClick={onSave} disabled={loading || !dirty} className="primary-action h-11 w-full rounded-xl px-4 text-sm font-black">
            <Save size={16} /> <span>{loading ? "Kaydediliyor..." : "Profili kaydet"}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}
