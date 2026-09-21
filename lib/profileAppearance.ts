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
