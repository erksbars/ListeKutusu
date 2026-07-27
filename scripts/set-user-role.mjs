import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = String(process.argv[2] || "").trim().toLowerCase();
const role = String(process.argv[3] || "").trim().toLowerCase();
const allowedRoles = new Set(["member", "moderator", "admin"]);

if (!email || !allowedRoles.has(role)) {
  console.error("Kullanım: npm run user:role -- kullanici@eposta.com member|moderator|admin");
  process.exitCode = 1;
} else {
  try {
    const account = await prisma.userList.findFirst({
      where: { email: { equals: email } },
      select: { id: true, ownerName: true, email: true },
    });
    if (!account) {
      console.error("Bu e-posta adresine ait hesap bulunamadı.");
      process.exitCode = 1;
    } else {
      await prisma.userList.update({ where: { id: account.id }, data: { role } });
      console.log(`${account.ownerName} (${account.email}) rolü '${role}' olarak güncellendi.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
