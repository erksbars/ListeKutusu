import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const checks = [
  {
    name: "Kimlik bilgisi eksik aktif hesap",
    count: () =>
      prisma.userList.count({
        where: {
          status: "active",
          OR: [{ email: null }, { passwordHash: null }, { submitCode: null }],
        },
      }),
  },
  {
    name: "Bilinmeyen hesap durumu",
    count: () =>
      prisma.userList.count({
        where: { status: { notIn: ["active", "deleted", "recycled"] } },
      }),
  },
  {
    name: "Bilinmeyen kullanıcı rolü",
    count: () =>
      prisma.userList.count({
        where: { role: { notIn: ["member", "moderator", "admin"] } },
      }),
  },
  {
    name: "Bilinmeyen öneri durumu",
    count: () =>
      prisma.suggestion.count({
        where: { status: { notIn: ["pending", "approved", "rejected", "removed"] } },
      }),
  },
  {
    name: "Bilinmeyen forum konusu durumu",
    count: () =>
      prisma.forumThread.count({
        where: { status: { notIn: ["pending", "published", "rejected", "removed"] } },
      }),
  },
  {
    name: "Bilinmeyen forum yanıtı durumu",
    count: () =>
      prisma.forumReply.count({
        where: { status: { notIn: ["published", "removed"] } },
      }),
  },
  {
    name: "Geçersiz kabul edilen forum yanıtı",
    count: async () => {
      const rows = await prisma.$queryRaw`
        SELECT COUNT(*) AS count
        FROM "ForumThread" AS thread
        LEFT JOIN "ForumReply" AS reply ON reply.id = thread.acceptedReplyId
        WHERE thread.acceptedReplyId IS NOT NULL
          AND (
            reply.id IS NULL
            OR reply.threadId <> thread.id
            OR reply.status <> 'published'
          )
      `;
      return Number(rows[0]?.count ?? 0);
    },
  },
  {
    name: "Süresi geçmiş açık oturum",
    count: () =>
      prisma.accountSession.count({
        where: { revokedAt: null, expiresAt: { lte: new Date() } },
      }),
  },
  {
    name: "Artık E2E test hesabı",
    count: () =>
      prisma.userList.count({
        where: {
          OR: [{ email: { startsWith: "e2e-" } }, { ownerName: { startsWith: "E2E " } }],
        },
      }),
  },
  {
    name: "Artık E2E test paylaşımı",
    count: () => prisma.feedPost.count({ where: { trackId: { startsWith: "e2e-track-" } } }),
  },
];

let failures = 0;
try {
  for (const check of checks) {
    const count = await check.count();
    const ok = count === 0;
    if (!ok) failures += 1;
    console.log(`${ok ? "PASS" : "FAIL"} ${check.name}: ${count}`);
  }
} finally {
  await prisma.$disconnect();
}

if (failures > 0) {
  console.error(`\n${failures} veri bütünlüğü kontrolü başarısız.`);
  process.exitCode = 1;
} else {
  console.log("\nVeri bütünlüğü kontrolleri başarılı.");
}
