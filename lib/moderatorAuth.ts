import { prisma } from "./db";
import { getAuthenticatedAccountListId, isOwnerAuthenticated } from "./session";
import { isModerationRole } from "./roles";

export type ModerationActor =
  | { kind: "owner"; id: null; label: "owner" }
  | { kind: "account"; id: string; label: string; role: "moderator" | "admin" };

export async function getModerationActor(): Promise<ModerationActor | null> {
  if (await isOwnerAuthenticated()) {
    return { kind: "owner", id: null, label: "owner" };
  }

  const accountId = await getAuthenticatedAccountListId();
  if (!accountId) return null;

  const account = await prisma.userList.findFirst({
    where: {
      id: accountId,
      status: "active",
      role: { in: ["moderator", "admin"] },
    },
    select: { id: true, ownerName: true, role: true },
  });
  if (!account || !isModerationRole(account.role)) return null;

  return {
    kind: "account",
    id: account.id,
    label: account.ownerName,
    role: account.role,
  };
}
