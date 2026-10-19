import type { PrismaClient } from "@prisma/client";

export async function communityHealth(db: PrismaClient, now = new Date()) {
  const checks: Array<{ key: string; label: string; severity: "error" | "warning"; count: number }> = [];
  const count = async (key: string, label: string, severity: "error" | "warning", query: Promise<Array<{ count: bigint | number }>>) => {
    checks.push({ key, label, severity, count: Number((await query)[0]?.count ?? 0) });
  };
  await count("owner-role", "Kurucu ve üyelik rolü tutarsız topluluk", "error", db.$queryRaw`
    SELECT COUNT(*) AS count FROM Community c WHERE
      NOT EXISTS (SELECT 1 FROM CommunityMember m WHERE m.communityId = c.id AND m.userId = c.ownerId AND m.role = 'owner' AND m.status = 'active')
      OR EXISTS (SELECT 1 FROM CommunityMember m WHERE m.communityId = c.id AND m.role = 'owner' AND m.userId <> c.ownerId)
  `);
  await count("inactive-owner", "Kurucu hesabı aktif olmayan topluluk", "warning", db.$queryRaw`
    SELECT COUNT(*) AS count FROM Community c JOIN UserList u ON u.id = c.ownerId WHERE c.status = 'active' AND u.status <> 'active'
  `);
  await count("member-state", "Bilinmeyen topluluk üyelik durumu veya rolü", "error", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityMember WHERE role NOT IN ('owner', 'moderator', 'member') OR status NOT IN ('active', 'banned')
  `);
  await count("event-state", "Geçersiz etkinlik durumu/kapasite/dağıtım", "error", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityEvent WHERE status NOT IN ('scheduled', 'cancelled', 'removed')
      OR distribution NOT IN ('community', 'general') OR timeZone <> 'Europe/Istanbul'
      OR (capacity IS NOT NULL AND (capacity < 2 OR capacity > 200))
  `);
  await count("rsvp-state", "Bilinmeyen katılım tercihi", "error", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityEventRsvp WHERE status NOT IN ('attending', 'interested', 'withdrawn')
  `);
  await count("rsvp-overcapacity", "Geçerli katılımı kapasiteyi aşan etkinlik", "error", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityEvent e WHERE e.status = 'scheduled' AND e.capacity IS NOT NULL AND
      (SELECT COUNT(*) FROM CommunityEventRsvp r JOIN UserList u ON u.id = r.userId
       JOIN CommunityMember m ON m.userId = r.userId AND m.communityId = e.communityId
       WHERE r.eventId = e.id AND r.status = 'attending' AND u.status = 'active' AND m.status = 'active') > e.capacity
  `);
  await count("closed-event-rsvp", "Kapanmış etkinlikte kalan aktif katılım tercihi", "error", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityEventRsvp r JOIN CommunityEvent e ON e.id = r.eventId
    WHERE e.status IN ('cancelled', 'removed') AND r.status IN ('attending', 'interested')
  `);
  await count("report-target", "Görünür hedefi olmayan bekleyen bildirim", "warning", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityReport r WHERE r.status = 'pending' AND NOT (
      (r.targetType = 'post' AND EXISTS (SELECT 1 FROM CommunityPost p WHERE p.id = r.targetId AND p.communityId = r.communityId AND p.status = 'published')) OR
      (r.targetType = 'comment' AND EXISTS (SELECT 1 FROM CommunityComment x JOIN CommunityPost p ON p.id = x.postId WHERE x.id = r.targetId AND p.communityId = r.communityId AND x.status = 'published' AND p.status = 'published')) OR
      (r.targetType = 'event' AND EXISTS (SELECT 1 FROM CommunityEvent e WHERE e.id = r.targetId AND e.communityId = r.communityId AND e.status IN ('scheduled', 'cancelled'))))
  `);
  await count("report-state", "Tutarsız bildirim inceleme durumu", "error", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityReport WHERE status NOT IN ('pending', 'reviewed') OR targetType NOT IN ('post', 'comment', 'event')
      OR (status = 'pending' AND (reviewedAt IS NOT NULL OR reviewedById IS NOT NULL))
  `);
  await count("completed-job-recipients", "Tamamlanan işte kalmış bekleyen alıcı", "error", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityEventNotificationJob j WHERE j.completedAt IS NOT NULL AND
      EXISTS (SELECT 1 FROM CommunityEventNotificationRecipient r WHERE r.jobId = j.id)
  `);
  await count("failed-job", "Manuel kurtarma bekleyen bildirim işi", "warning", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityEventNotificationJob WHERE completedAt IS NULL AND failedAt IS NOT NULL
  `);
  const cutoff = new Date(now.getTime() - 5 * 60_000);
  await count("old-pending-job", "Beş dakikadan uzun bekleyen bildirim işi", "warning", db.$queryRaw`
    SELECT COUNT(*) AS count FROM CommunityEventNotificationJob WHERE completedAt IS NULL AND failedAt IS NULL AND createdAt < ${cutoff}
  `);
  const errors = checks.filter(check => check.severity === "error" && check.count > 0).length;
  const warnings = checks.filter(check => check.severity === "warning" && check.count > 0).length;
  return { status: errors ? "failed" : warnings ? "warning" : "ok", errors, warnings, checks };
}
