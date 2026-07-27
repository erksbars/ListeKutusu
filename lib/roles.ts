export type UserRole = "member" | "moderator" | "admin";
export type ModerationRole = Extract<UserRole, "moderator" | "admin">;

export function isModerationRole(role: unknown): role is ModerationRole {
  return role === "moderator" || role === "admin";
}

export function isAssignableCommunityRole(role: unknown): role is "member" | "moderator" {
  return role === "member" || role === "moderator";
}
