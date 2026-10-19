import { CommunityError } from "./communityError.ts";

export function communityDistribution(value: unknown, fallback = "community") {
  if (value === undefined) return fallback;
  if (value !== "community" && value !== "general") throw new CommunityError("Geçerli bir akış tercihi seç.");
  return value;
}
