"use client";

import Link from "next/link";
import { ExternalLink, Palette, Save } from "lucide-react";

const PROFILE_THEMES = [
  ["aurora", "Aurora", "from-cyan-400 via-blue-500 to-violet-500"],
  ["violet", "Mor", "from-fuchsia-400 via-violet-500 to-indigo-500"],
  ["emerald", "Zümrüt", "from-emerald-300 via-teal-500 to-cyan-500"],
  ["sunset", "Gün batımı", "from-rose-400 via-orange-400 to-violet-500"],
] as const;

type AccountProfilePanelProps = {
  slug: string;
  bio: string;
  genres: string;
  theme: string;
  dirty: boolean;
  loading: boolean;
  onBioChange: (value: string) => void;
  onGenresChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onSave: () => void;
};

export function AccountProfilePanel({
  slug,
  bio,
  genres,
  theme,
  dirty,
  loading,
  onBioChange,
  onGenresChange,
  onThemeChange,
  onSave,
}: AccountProfilePanelProps) {
  return (
    <div className="max-w-3xl">
      <section className="account-content-panel">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="section-kicker">Profil görünümü</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Sosyal profiline kısa bir kimlik kazandır.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {dirty && <span className="unsaved-badge">Kaydedilmedi</span>}
            <Link href={`/u/${slug}`} className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-navy">
              <span>Profili aç</span> <ExternalLink size={14} />
            </Link>
          </div>
        </div>
        <label htmlFor="profile-bio" className="form-label mt-5">Profil açıklaması</label>
        <textarea
          id="profile-bio"
          value={bio}
          onChange={(event) => onBioChange(event.target.value.slice(0, 240))}
          rows={4}
          maxLength={240}
          placeholder="Müzik zevkini birkaç cümleyle anlat..."
          className="ghost-input mt-2 w-full resize-none rounded-xl px-4 py-3 text-sm leading-6 outline-none transition"
        />
        <div className="mt-1 text-right text-xs font-bold text-slate-400">{bio.length}/240</div>
        <label htmlFor="profile-genres" className="form-label mt-3">Favori müzik türleri</label>
        <input
          id="profile-genres"
          type="text"
          value={genres}
          onChange={(event) => onGenresChange(event.target.value)}
          placeholder="Favori türler: rock, caz, elektronik"
          className="ghost-input mt-2 h-11 w-full rounded-xl px-4 text-sm outline-none transition"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Virgülle ayır; en fazla 6 tür profilinde gösterilir.
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs font-black text-slate-500"><Palette size={16} /> Profil rengi</div>
        <div className="mt-2 grid grid-cols-4 gap-2" aria-label="Profil rengi">
          {PROFILE_THEMES.map(([value, label, gradient]) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={theme === value}
              onClick={() => onThemeChange(value)}
              className={`h-10 rounded-xl bg-gradient-to-br ${gradient} transition ${
                theme === value ? "ring-2 ring-sky-700 ring-offset-2" : "opacity-60 hover:opacity-100"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={loading || !dirty}
          className="primary-action mt-4 h-11 w-full rounded-xl px-4 text-sm font-black disabled:bg-slate-300"
        >
          <Save size={16} /> <span>Profili kaydet</span>
        </button>
      </section>
    </div>
  );
}
