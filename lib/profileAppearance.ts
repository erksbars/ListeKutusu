export const PROFILE_DENSITIES = ["comfortable", "compact"] as const;
export type ProfileDensity = (typeof PROFILE_DENSITIES)[number];

export const PROFILE_BANNERS = ["line", "band", "split"] as const;
export type ProfileBanner = (typeof PROFILE_BANNERS)[number];

export function normalizeProfileDensity(value: unknown): ProfileDensity {
  return typeof value === "string" && PROFILE_DENSITIES.includes(value as ProfileDensity)
    ? (value as ProfileDensity)
    : "comfortable";
}

export function normalizeProfileBanner(value: unknown): ProfileBanner {
  return typeof value === "string" && PROFILE_BANNERS.includes(value as ProfileBanner)
    ? (value as ProfileBanner)
    : "line";
}
export const PROFILE_PRESETS = {
  aurora: { label: "Aurora", gradient: "linear-gradient(110deg, var(--ui-primary), var(--ui-info) 52%, var(--ui-secondary))" },
  violet: { label: "Mor", gradient: "linear-gradient(110deg, var(--ui-danger), var(--ui-secondary) 52%, var(--ui-info))" },
  emerald: { label: "Zümrüt", gradient: "linear-gradient(110deg, var(--ui-success), var(--ui-accent) 52%, var(--ui-primary))" },
  sunset: { label: "Gün batımı", gradient: "linear-gradient(110deg, var(--ui-danger), var(--ui-warning) 52%, var(--ui-secondary))" },
} as const;

export function getProfilePreset(value: string) {
  return Object.prototype.hasOwnProperty.call(PROFILE_PRESETS, value)
    ? PROFILE_PRESETS[value as keyof typeof PROFILE_PRESETS]
    : PROFILE_PRESETS.aurora;
}
