import { PROFILE_BANNERS, PROFILE_DENSITIES, PROFILE_PRESETS, type ProfileBanner, type ProfileDensity } from "./profileAppearance.ts";
import { PROFILE_SHOWCASE_MODULES } from "./profileShowcase.ts";

export type SavedProfile = {
  id: string; bio: string | null; profileStatus: string | null;
  universityName: string | null; universityPublic: boolean;
  pinnedFeedPostId: string | null; featuredAchievementId: string | null;
  favoriteGenres: string | null; profileShowcase: string;
  profileTheme: string; profileDensity: ProfileDensity; profileBanner: ProfileBanner;
};
const nullableText = (value: unknown): value is string | null => value === null || typeof value === "string";
const object = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object" && !Array.isArray(value);
function stringList(value: unknown): string[] | null {
  if (value === null) return [];
  if (typeof value !== "string" || value.length > 4096) return null;
  try { const list = JSON.parse(value); return Array.isArray(list) && list.every(item => typeof item === "string") ? list : null; }
  catch { return null; }
}

/** Only confirmed profile fields from the current account can become the saved baseline. */
export function parseSavedProfile(value: unknown, accountId: string): SavedProfile | null {
  if (!object(value) || value.id !== accountId || !nullableText(value.bio) || !nullableText(value.profileStatus)
    || !nullableText(value.universityName) || typeof value.universityPublic !== "boolean"
    || !nullableText(value.pinnedFeedPostId) || !nullableText(value.featuredAchievementId)
    || !nullableText(value.favoriteGenres) || typeof value.profileShowcase !== "string"
    || typeof value.profileTheme !== "string" || !Object.hasOwn(PROFILE_PRESETS, value.profileTheme)
    || !PROFILE_DENSITIES.includes(value.profileDensity as ProfileDensity) || !PROFILE_BANNERS.includes(value.profileBanner as ProfileBanner)) return null;
  const genres = stringList(value.favoriteGenres), showcase = stringList(value.profileShowcase);
  if (!genres || genres.length > 6 || !showcase?.length || new Set(showcase).size !== showcase.length
    || showcase.some(item => !PROFILE_SHOWCASE_MODULES.includes(item as typeof PROFILE_SHOWCASE_MODULES[number]))) return null;
  return { id: accountId, bio: value.bio, profileStatus: value.profileStatus,
    universityName: value.universityName, universityPublic: value.universityPublic,
    pinnedFeedPostId: value.pinnedFeedPostId, featuredAchievementId: value.featuredAchievementId,
    favoriteGenres: value.favoriteGenres, profileShowcase: value.profileShowcase,
    profileTheme: value.profileTheme, profileDensity: value.profileDensity as ProfileDensity, profileBanner: value.profileBanner as ProfileBanner };
}
