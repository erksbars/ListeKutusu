import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { setTimeout as delay } from "node:timers/promises";
import { hashPassword } from "../../lib/password.ts";
import { communityHealth } from "../../lib/communityHealth.ts";
import { eventOutboxStatus } from "../../lib/communityEventOutbox.ts";
import { snapshotSqlite, rehearseSqliteRestore, sqliteFingerprint } from "./sqlite-rehearsal.mjs";
import { encryptBackup, decryptBackup } from "./encrypted-backup.mjs";
import { createRehearsalDirectory, copyRehearsalSource, removeRehearsalDirectory, rehearsalEnvironment } from "./http-rehearsal-isolation.mjs";
import { startRehearsalChild, initializeRehearsalDatabase, rehearsalHttpClient, expectRehearsalStatus as expect } from "./http-worker-rehearsal.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const requireTrue = (value, issue) => { if (!value) throw new Error(issue); };

export async function rehearseHttpRecovery(progress = () => {}) {
  const source = await createRehearsalDirectory(root);
  let restored, originalDb, restoredDb, sourceServer, restoredServer, worker, cleanupSafe = true;
  try {
    progress("RECOVERY_SOURCE_FIXTURE");
    await copyRehearsalSource(root, source);
    const env = { ...rehearsalEnvironment(), DATABASE_URL: await initializeRehearsalDatabase(source) };
    originalDb = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });
    const password = randomBytes(24).toString("hex"), passwordHash = await hashPassword(password);
    const ids = ["recovery-owner", "recovery-member", "recovery-outsider"];
    await originalDb.userList.createMany({ data: ids.map(id => ({ id, slug: id, ownerName: "Sentetik kurtarma hesabı", email: `${id}@example.test`, passwordHash })) });
    sourceServer = startRehearsalChild("server", source, env);
    const base = `http://127.0.0.1:${(await sourceServer.ready).port}`, http = rehearsalHttpClient(base), cookies = [];
    for (const id of ids) {
      const result = await http("/api/accounts/login", "", "POST", { email: `${id}@example.test`, password });
      expect(result, 200, "SOURCE_LOGIN"); requireTrue(result.cookie.includes("account_session="), "SOURCE_SESSION_MISSING"); cookies.push(result.cookie);
    }
    const slug = expect(await http("/api/communities", cookies[0], "POST", { name: "Sentetik kurtarma topluluğu", description: "Yedekten dönen uygulama akışını sınayan sentetik topluluk.", category: "interest", rules: "Geçici ve gerçek katılımcı içermeyen prova." }), 201, "SOURCE_COMMUNITY").slug;
    const community = `/api/communities/${slug}`;
    expect(await http(community, cookies[1], "POST", { action: "join" }), 200, "SOURCE_JOIN");
    const postId = expect(await http(community, cookies[1], "POST", { action: "create-post", type: "review", title: "Sentetik kitap incelemesi", body: "Yedekten sonra aynı içerikle korunması gereken sentetik inceleme.", reviewKind: "book", subjectTitle: "Kurgusal prova kitabı", rating: 8, spoiler: false }), 200, "SOURCE_REVIEW").post.id;
    const input = { title: "Sentetik kurtarma etkinliği", description: "Yalnız izole şifreli yedek ve uygulama kurtarma provasına ait etkinlik.", localStart: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 16), city: "İstanbul", venue: "Kurgusal kaynak alanı", capacity: 2, publicLocationConfirmed: true };
    const eventId = expect(await http(`${community}/events`, cookies[0], "POST", input), 201, "SOURCE_EVENT").event.id;
    const eventRoute = `${community}/events/${eventId}`;
    expect(await http(eventRoute, cookies[1], "POST", { action: "rsvp", status: "attending" }), 200, "SOURCE_RSVP");
    expect(await http(eventRoute, cookies[0], "PATCH", { ...input, venue: "Yedekteki güncel alan", expectedVersion: 0 }), 200, "SOURCE_UPDATE");
    requireTrue((await eventOutboxStatus(originalDb)).pending === 1 && await originalDb.notification.count() === 0, "SOURCE_OUTBOX_NOT_PENDING");

    // Quiesce only this invocation's server; source is synthetic, never the real DB.
    requireTrue(await sourceServer.stop(), "SOURCE_STOP_INCOMPLETE"); sourceServer = null;
    await originalDb.$disconnect(); originalDb = null;
    const snapshot = path.join(source, "snapshot.db"), encrypted = path.join(source, "snapshot.lkbackup");
    const phrase = randomBytes(32).toString("base64url");
    await snapshotSqlite(path.join(source, "synthetic-http.db"), snapshot);
    const before = sqliteFingerprint(snapshot), snapshotBytes = await readFile(snapshot);
    progress("ENCRYPTED_BACKUP_AND_FRESH_RESTORE");
    const started = performance.now();
    await encryptBackup(snapshot, encrypted, phrase);
    restored = await createRehearsalDirectory(root); await copyRehearsalSource(root, restored);
    const decrypted = path.join(restored, "decrypted.db"), restoredFile = path.join(restored, "synthetic-http.db");
    await decryptBackup(encrypted, decrypted, phrase);
    const restore = await rehearseSqliteRestore(decrypted, restoredFile);
    requireTrue(JSON.stringify(before) === JSON.stringify(sqliteFingerprint(restoredFile)), "RESTORE_FULL_CONTENT_MISMATCH");
    const restoredEnv = { ...env, DATABASE_URL: `file:${restoredFile.replaceAll("\\", "/")}` };
    restoredDb = new PrismaClient({ datasources: { db: { url: restoredEnv.DATABASE_URL } } });
    requireTrue((await eventOutboxStatus(restoredDb)).pending === 1 && await restoredDb.notification.count() === 0, "RESTORED_OUTBOX_MISSING");
    restoredServer = startRehearsalChild("server", restored, restoredEnv);
    const restoredHttp = rehearsalHttpClient(`http://127.0.0.1:${(await restoredServer.ready).port}`);
    progress("RESTORED_HTTP_SESSIONS_AND_STATE");
    const me = expect(await restoredHttp("/api/accounts/me?view=summary", cookies[1]), 200, "RESTORED_SESSION");
    requireTrue(me.list?.id === ids[1], "RESTORED_SESSION_OWNER_MISMATCH");
    const detail = expect(await restoredHttp(eventRoute, cookies[1]), 200, "RESTORED_EVENT");
    requireTrue(detail.event?.venue === "Yedekteki güncel alan", "RESTORED_EVENT_CONTENT_MISSING");
    const review = await restoredDb.communityPost.findUniqueOrThrow({ where: { id: postId } });
    requireTrue(review.authorId === ids[1] && review.subjectTitle === "Kurgusal prova kitabı" && review.rating === 8, "RESTORED_REVIEW_MISSING");
    const restoredCommunity = expect(await restoredHttp(community, cookies[1]), 200, "RESTORED_COMMUNITY");
    requireTrue(restoredCommunity.posts?.some(post => post.id === postId && post.rating === 8), "RESTORED_REVIEW_NOT_VISIBLE");
    requireTrue(await restoredDb.communityEventRsvp.count({ where: { eventId, userId: ids[1], status: "attending" } }) === 1, "RESTORED_RSVP_MISSING");
    expect(await restoredHttp(eventRoute, cookies[2], "POST", { action: "rsvp", status: "attending" }), 403, "RESTORED_MEMBERSHIP_GUARD");
    expect(await restoredHttp("/api/accounts/me?view=summary"), 401, "RESTORED_SESSION_GUARD");
    // Login remains usable; the pre-backup session also remains valid at snapshot state.
    expect(await restoredHttp("/api/accounts/login", "", "POST", { email: `${ids[0]}@example.test`, password }), 200, "RESTORED_PASSWORD_LOGIN");
    progress("RESTORED_WORKER_PENDING_DELIVERY");
    worker = startRehearsalChild("worker", restored, restoredEnv); await worker.ready;
    const deadline = Date.now() + 20_000;
    while (await restoredDb.notification.count({ where: { communityEventId: eventId } }) !== 1 && Date.now() < deadline) await delay(200);
    const notifications = expect(await restoredHttp("/api/notifications", cookies[1]), 200, "RESTORED_NOTIFICATION").notifications;
    requireTrue(notifications.filter(item => item.communityEventId === eventId).length === 1, "RESTORED_DELIVERY_MISSING");
    const notificationId = notifications.find(item => item.communityEventId === eventId).id;
    expect(await restoredHttp("/api/notifications", cookies[1], "PATCH", { id: notificationId }), 200, "RESTORED_READ_MARK");
    const readAt = (await restoredDb.notification.findUniqueOrThrow({ where: { id: notificationId } })).readAt;
    requireTrue(readAt instanceof Date, "RESTORED_READ_MARK_MISSING");
    requireTrue(await worker.stop(), "RESTORED_WORKER_STOP_INCOMPLETE"); worker = null;
    // Real worker restart, not direct batch calls; completed work must not duplicate/reset readAt.
    worker = startRehearsalChild("worker", restored, restoredEnv); await worker.ready; await delay(2300);
    const after = await restoredDb.notification.findUniqueOrThrow({ where: { id: notificationId } });
    requireTrue(await restoredDb.notification.count({ where: { communityEventId: eventId } }) === 1 && +after.readAt === +readAt, "RESTORED_DELIVERY_NOT_IDEMPOTENT");
    expect(await restoredHttp(eventRoute, cookies[1], "POST", { action: "rsvp", status: "withdrawn" }), 200, "RESTORED_WRITE");
    const queue = await eventOutboxStatus(restoredDb), health = await communityHealth(restoredDb);
    requireTrue(queue.pending === 0 && queue.failed === 0 && health.errors === 0 && health.warnings === 0, "RESTORED_HEALTH_FAILED");
    requireTrue(worker.isRunning() && restoredServer.isRunning(), "RESTORED_CHILD_EXITED");
    requireTrue(snapshotBytes.equals(await readFile(snapshot)) && JSON.stringify(before) === JSON.stringify(sqliteFingerprint(path.join(source, "synthetic-http.db"))), "SOURCE_CHANGED_BY_RECOVERY");
    return { schema: 1, scope: "synthetic-local-encrypted-http-recovery", productionRecoveryEvidence: false, liveReplaced: false,
      encrypted: true, fullContentEqual: restore.contentEqual, restoredSessions: true, restoredPasswordLogin: true, restoredReview: true, membershipGuard: true, pendingJobRecovered: true,
      notificationCount: 1, workerRestartIdempotent: true, readAtPreserved: true, postRestoreWrite: true, sourceUnchanged: true,
      elapsedRestoreAndFlowMs: Math.round(performance.now() - started), integrity: { errors: health.errors, warnings: health.warnings }, ok: true };
  } finally {
    for (const child of [worker, restoredServer, sourceServer]) if (child && !await child.stop()) cleanupSafe = false;
    if (originalDb) await originalDb.$disconnect(); if (restoredDb) await restoredDb.$disconnect();
    if (!cleanupSafe) throw new Error("RECOVERY_CHILD_STOP_INCOMPLETE_TEMP_RETAINED");
    if (restored) await removeRehearsalDirectory(restored, root);
    await removeRehearsalDirectory(source, root);
  }
}
