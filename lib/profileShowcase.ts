export const PROFILE_SHOWCASE_MODULES = ["featured", "identity", "recent", "forum"] as const;
export type ProfileShowcaseModule = (typeof PROFILE_SHOWCASE_MODULES)[number];

export const DEFAULT_PROFILE_SHOWCASE: ProfileShowcaseModule[] = ["featured", "identity", "recent", "forum"];

export function normalizeProfileShowcase(value: unknown): ProfileShowcaseModule[] {
  let candidates: unknown[] = [];
  if (Array.isArray(value)) candidates = value;
  else if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) candidates = parsed;
    } catch {
      candidates = [];
    }
  }

  const allowed = new Set<string>(PROFILE_SHOWCASE_MODULES);
  const normalized = [...new Set(candidates.filter((item): item is ProfileShowcaseModule => typeof item === "string" && allowed.has(item)))];
  return normalized.length ? normalized : [...DEFAULT_PROFILE_SHOWCASE];
}
