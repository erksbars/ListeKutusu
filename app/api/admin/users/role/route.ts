import { NextRequest, NextResponse } from "next/server";
import { writeAdminAuditLog } from "@/lib/adminAudit";
import { prisma } from "@/lib/db";
import { isAssignableCommunityRole } from "@/lib/roles";
import { isOwnerAuthenticated } from "@/lib/session";

export async function PATCH(req: NextRequest) {
  if (!(await isOwnerAuthenticated())) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id.trim() : "";
  const role = body?.role;
  if (!id || !isAssignableCommunityRole(role)) {
    return NextResponse.json({ error: "Geçersiz kullanıcı veya rol." }, { status: 400 });
  }

  const account = await prisma.userList.findFirst({
    where: { id, status: "active" },
    select: { id: true, ownerName: true, email: true, role: true },
  });
  if (!account) {
    return NextResponse.json({ error: "Aktif kullanıcı bulunamadı." }, { status: 404 });
  }
  if (account.role === "admin") {
    return NextResponse.json(
      { error: "Sistem yöneticisi rolü bu ekrandan değiştirilemez." },
      { status: 409 }
    );
  }
  if (account.role === role) {
    return NextResponse.json({ ok: true, unchanged: true, user: { id: account.id, role } });
  }

  const updated = await prisma.userList.update({
    where: { id: account.id },
    data: { role },
    select: { id: true, role: true },
  });
  await writeAdminAuditLog({
    action: "user.role_change",
    targetType: "user",
    targetId: account.id,
    targetLabel: account.ownerName,
    metadata: { previousRole: account.role, nextRole: role, email: account.email },
  });

  return NextResponse.json({ ok: true, user: updated });
}
