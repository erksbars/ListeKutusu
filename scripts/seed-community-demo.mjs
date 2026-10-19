import { PrismaClient } from "@prisma/client";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { communityInput, communityPostInput } from "../lib/communities.ts";
import { demoUsers, demoCommunities, demoMembers, demoPosts, demoComments } from "./community-demo-data.mjs";

export const demoCounts = { users: demoUsers.length, communities: demoCommunities.length, memberships: demoMembers.length, posts: demoPosts.length, reviews: demoPosts.filter(post => post.type === "review").length, comments: demoComments.length };
export function assertLocalDemoEnvironment(env) {
  const hostname = new URL(env.APP_URL || "http://127.0.0.1:3000").hostname;
  if (env.NODE_ENV === "production" || !["127.0.0.1", "localhost", "[::1]"].includes(hostname) || !env.DATABASE_URL?.startsWith("file:")) throw new Error("Demo verisi yalnız yerel SQLite geliştirme ortamına eklenebilir.");
}
export async function seedCommunityDemo(db, now = new Date()) {
  // Validate all fixture payloads with the same rules as the product before writing.
  for (const item of demoCommunities) communityInput(item);
  for (const item of demoPosts) communityPostInput(item);
  const ago = hours => new Date(now.getTime() - hours * 3_600_000);
  return db.$transaction(async tx => {
    for (const user of demoUsers) {
      const clashes = await tx.userList.findMany({ where: { OR: [{ id: user.id }, { slug: user.slug }, { email: user.email }] }, select: { id: true, slug: true, email: true } });
      if (clashes.some(row => row.id !== user.id || row.slug !== user.slug || row.email !== user.email)) throw new Error("Demo profil kimliği mevcut bir kayıtla çakışıyor; hiçbir veri değiştirilmedi.");
      await tx.userList.upsert({ where: { id: user.id }, create: { ...user, passwordHash: null, role: "member", createdAt: ago(240) }, update: {}, select: { id: true } });
    }
    for (const [index, community] of demoCommunities.entries()) {
      const clashes = await tx.community.findMany({ where: { OR: [{ id: community.id }, { slug: community.slug }] }, select: { id: true, slug: true, ownerId: true } });
      if (clashes.some(row => row.id !== community.id || row.slug !== community.slug || row.ownerId !== community.ownerId)) throw new Error("Demo topluluk kimliği mevcut bir kayıtla çakışıyor; hiçbir veri değiştirilmedi.");
      await tx.community.upsert({ where: { id: community.id }, create: { ...community, createdAt: ago(200 + index) }, update: {} });
    }
    for (const member of demoMembers) await tx.communityMember.upsert({ where: { communityId_userId: { communityId: member.communityId, userId: member.userId } }, create: { ...member, joinedAt: ago(190) }, update: {} });
    for (const { hoursAgo, ...post } of demoPosts) {
      const existing = await tx.communityPost.findUnique({ where: { id: post.id }, select: { communityId: true, authorId: true } });
      if (existing && (existing.communityId !== post.communityId || existing.authorId !== post.authorId)) throw new Error("Demo paylaşım kimliği çakışıyor; hiçbir veri değiştirilmedi.");
      await tx.communityPost.upsert({ where: { id: post.id }, create: { ...post, createdAt: ago(hoursAgo) }, update: {} });
    }
    for (const { hoursAgo, ...comment } of demoComments) {
      const existing = await tx.communityComment.findUnique({ where: { id: comment.id }, select: { postId: true, authorId: true } });
      if (existing && (existing.postId !== comment.postId || existing.authorId !== comment.authorId)) throw new Error("Demo yorum kimliği çakışıyor; hiçbir veri değiştirilmedi.");
      await tx.communityComment.upsert({ where: { id: comment.id }, create: { ...comment, createdAt: ago(hoursAgo) }, update: {} });
    }
    return demoCounts;
  }, { timeout: 30_000 });
}

async function main() {
  assertLocalDemoEnvironment(process.env);
  if (!process.argv.includes("--apply")) { console.log("Yalnız plan (yazma yok):", demoCounts); return; }
  const db = new PrismaClient();
  try {
    const directory = path.resolve("backups");
    await mkdir(directory, { recursive: true });
    const backup = path.join(directory, `pre-community-demo-${Date.now()}.db`);
    await db.$executeRawUnsafe(`VACUUM INTO '${backup.replaceAll("\\", "/").replaceAll("'", "''")}'`);
    if ((await stat(backup)).size < 4096 || (await readFile(backup)).subarray(0, 16).toString() !== "SQLite format 3\u0000") throw new Error("Demo ekleme durduruldu: yedek doğrulanamadı.");
    console.log("SQLite yedeği doğrulandı:", backup);
    console.log("Demo veri seti hazır:", await seedCommunityDemo(db));
  } finally { await db.$disconnect(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
