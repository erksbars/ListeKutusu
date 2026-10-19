import { randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";
import { normalizeFeedComment } from "./feedComments.ts";
import { createForumSlug } from "./forum.ts";

import { COMMUNITY_CATEGORIES, REVIEW_KINDS } from "./communityTypes.ts";
import { CommunityError } from "./communityError.ts";
import { resolveReviewReference, resolveCatalogReviewReference } from "./communityReferences.ts";
import { communityDistribution } from "./communityDistribution.ts";
import { communityDiscoveryInput, discoveryWhere } from "./communityDiscovery.ts";
import { moderationNote, recordCommunityAction, reviewCommunityReports } from "./communityAudit.ts";
import { lockActiveAccount } from "./communityLifecycle.ts";
import { validPostFilters } from "./communityPostFilters.ts";
import { communityReactionMetrics, setCommunityPostReaction } from "./communityPostReactions.ts";
export { CommunityError } from "./communityError.ts";
type Db = Prisma.TransactionClient;
const authorSelect = { id: true, ownerName: true, slug: true } as const;
const postAttributes = { distribution: true, type: true, reviewKind: true, subjectTitle: true, rating: true, spoiler: true, sourceUrl: true, referenceProvider: true } as const;
const staff = (role?: string | null) => role === "owner" || role === "moderator";
function text(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== "string") throw new CommunityError(`${label} gerekli.`);
  const result = value.replace(/\r\n?/g, "\n").trim();
  if (result.length < min || result.length > max) throw new CommunityError(`${label} ${min}–${max} karakter olmalı.`);
  return result;
}
export function communityInput(body: Record<string, unknown>) {
  if (typeof body.category !== "string" || !Object.hasOwn(COMMUNITY_CATEGORIES, body.category)) throw new CommunityError("Geçerli bir topluluk türü seç.");
  return { name: text(body.name, "Topluluk adı", 3, 60), description: text(body.description, "Açıklama", 10, 600),
    rules: text(body.rules, "Kurallar", 10, 2000), category: body.category, ...communityDiscoveryInput(body) };
}
export function communityPage(raw?: string | null) {
  if (!raw) return 1;
  if (!/^[1-9]\d{0,2}$/.test(raw) || Number(raw) > 100) throw new CommunityError("Geçersiz sayfa.");
  return Number(raw);
}
export function communityPostInput(body: Record<string, unknown>) {
  const type = body.type === undefined ? "discussion" : body.type;
  if (type !== "discussion" && type !== "review") throw new CommunityError("Geçersiz paylaşım türü.");
  const base = { title: text(body.title, "Başlık", 3, 120), body: text(body.body, type === "review" ? "İnceleme" : "Paylaşım", type === "review" ? 20 : 2, 5000), type, distribution: communityDistribution(body.distribution) };
  if (type === "discussion") {
    if (body.spoiler !== undefined && body.spoiler !== false) throw new CommunityError("Spoiler seçeneği yalnız incelemeler içindir.");
    return { ...base, reviewKind: null, subjectTitle: null, rating: null, spoiler: false, sourceUrl: null };
  }
  if (typeof body.reviewKind !== "string" || !Object.hasOwn(REVIEW_KINDS, body.reviewKind)) throw new CommunityError("Geçerli bir inceleme türü seç.");
  if (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 10) throw new CommunityError("Puan 1–10 arasında tam sayı olmalı.");
  if (body.spoiler !== undefined && typeof body.spoiler !== "boolean") throw new CommunityError("Geçersiz spoiler seçimi.");
  let sourceUrl: string | null = null;
  if (body.sourceUrl !== undefined && body.sourceUrl !== null && body.sourceUrl !== "") {
    const source = text(body.sourceUrl, "Eser bağlantısı", 1, 2000);
    let url: URL;
    try { url = new URL(source); } catch { throw new CommunityError("Geçerli bir HTTPS eser bağlantısı ekle."); }
    const hosts = ["open.spotify.com", "www.tvmaze.com", "tvmaze.com", "www.wikidata.org", "wikidata.org", "openlibrary.org", "store.steampowered.com", "boardgamegeek.com", "www.boardgamegeek.com"];
    if (url.protocol !== "https:" || url.username || url.password || url.port || !hosts.includes(url.hostname)) throw new CommunityError("Spotify, TVmaze, Wikidata, Open Library, Steam veya BoardGameGeek HTTPS bağlantısı kullan.");
    sourceUrl = url.href;
  }
  return { ...base, reviewKind: body.reviewKind, subjectTitle: text(body.subjectTitle, "Eser adı", 1, 160), rating: body.rating, spoiler: body.spoiler === true, sourceUrl };
}
export function visibleAuthor(viewerId: string | null): Prisma.UserListWhereInput {
  return { status: "active", ...(viewerId ? {
    blocksInitiated: { none: { blockedId: viewerId } }, blocksReceived: { none: { blockerId: viewerId } },
  } : {}) };
}
export async function community(db: Db, slug: string) {
  if (slug.length > 100) throw new CommunityError("Topluluk bulunamadı.", 404);
  const result = await db.community.findUnique({ where: { slug } });
  if (!result) throw new CommunityError("Topluluk bulunamadı.", 404);
  return result;
}
export async function membership(db: Db, communityId: string, userId: string, allowArchived = false) {
  const member = await db.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } });
  if (!member || member.status !== "active") throw new CommunityError(member?.status === "banned" ? "Bu toplulukta paylaşım yapamazsın." : "Önce topluluğa katıl.", 403);
  if (!allowArchived && !await db.community.findFirst({ where: { id: communityId, status: "active" }, select: { id: true } })) throw new CommunityError("Bu topluluk arşivde; yalnız okunabilir.", 409);
  return member;
}
export async function activeUser(db: Db, id: string) {
  if (!await db.userList.findFirst({ where: { id, status: "active" }, select: { id: true } })) throw new CommunityError("Önce giriş yapmalısın.", 401);
}

export function createCommunities(db: PrismaClient) {
  return {
    async directory(viewerId: string | null, query: string, category: string, page: number, mine = false, discovery: Record<string, unknown> = {}) {
      if (query.length > 100) throw new CommunityError("Arama en fazla 100 karakter olabilir.");
      if (category && !Object.hasOwn(COMMUNITY_CATEGORIES, category)) throw new CommunityError("Geçersiz kategori.");
      if (mine && !viewerId) throw new CommunityError("Önce giriş yapmalısın.", 401);
      const where: Prisma.CommunityWhereInput = {
        ...(!mine ? { status: "active" } : {}),
        ...discoveryWhere(discovery),
        ...(query ? { OR: [{ name: { contains: query } }, { description: { contains: query } }] } : {}),
        ...(category ? { category } : {}), ...(mine ? { members: { some: { userId: viewerId!, status: "active" } } } : {}),
      };
      const [rows, total] = await Promise.all([
        db.community.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], skip: (page - 1) * 20, take: 20,
          select: { id: true, slug: true, name: true, description: true, category: true, status: true, universityName: true, city: true, interest: true,
            _count: { select: { members: { where: { status: "active", user: { status: "active" } } } } } } }),
        db.community.count({ where }),
      ]);
      return { communities: rows.map(({ _count, ...row }) => ({ ...row, memberCount: _count.members })), total, page, hasMore: total > page * 20, authenticated: Boolean(viewerId) };
    },
    async create(userId: string, body: Record<string, unknown>) {
      const data = communityInput(body);
      return db.$transaction(async tx => {
        await lockActiveAccount(tx, userId);
        await activeUser(tx, userId);
        return tx.community.create({ data: { ...data, ownerId: userId, slug: createForumSlug(data.name, randomBytes(5).toString("hex")),
          members: { create: { userId, role: "owner" } } }, select: { slug: true } });
      });
    },
    async detail(slug: string, viewerId: string | null, page: number, postType = "all", reviewKind = "all", savedOnly = false) {
      if (!validPostFilters(postType, reviewKind)) throw new CommunityError("Geçersiz paylaşım filtresi.");
      if (savedOnly) { if (!viewerId) throw new CommunityError("Kaydettiklerini görmek için giriş yap.", 401); await activeUser(db, viewerId); }
      const row = await community(db, slug);
      const member = viewerId ? await db.communityMember.findUnique({ where: { communityId_userId: { communityId: row.id, userId: viewerId } } }) : null;
      const canModerate = member?.status === "active" && staff(member.role) && Boolean(viewerId && await db.userList.findFirst({ where: { id: viewerId, status: "active" }, select: { id: true } }));
      const where: Prisma.CommunityPostWhereInput = { communityId: row.id, status: "published", author: visibleAuthor(viewerId), ...(postType !== "all" ? { type: postType } : {}), ...(reviewKind !== "all" ? { reviewKind } : {}), ...(savedOnly ? { saves: { some: { userId: viewerId! } } } : {}) };
      const [posts, count, memberCount, members, reports] = await Promise.all([
        db.communityPost.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20,
          select: { id: true, title: true, body: true, ...postAttributes, createdAt: true, editedAt: true, author: { select: authorSelect },
            _count: { select: { comments: { where: { status: "published", author: visibleAuthor(viewerId) } } } } } }),
        db.communityPost.count({ where }),
        db.communityMember.count({ where: { communityId: row.id, status: "active", user: { status: "active" } } }),
        canModerate ? db.communityMember.findMany({ where: { communityId: row.id, user: { status: "active" } }, take: 50, orderBy: [{ joinedAt: "desc" }, { userId: "desc" }], select: { userId: true, role: true, status: true, user: { select: authorSelect } } }) : [],
        canModerate ? db.communityReport.findMany({ where: { communityId: row.id, status: "pending" }, take: 30, orderBy: { createdAt: "asc" }, select: { id: true, targetType: true, targetId: true, reason: true, createdAt: true } }) : [],
      ]);
      const reportedComments = canModerate ? await db.communityComment.findMany({ where: { id: { in: reports.filter(report => report.targetType === "comment").map(report => report.targetId) }, post: { communityId: row.id } }, select: { id: true, postId: true } }) : [];
      const reactions = await communityReactionMetrics(db, row, posts, viewerId);
      return { community: { id: row.id, slug: row.slug, name: row.name, description: row.description, category: row.category, status: row.status, rules: row.rules, universityName: row.universityName, city: row.city, interest: row.interest, memberCount },
        viewerId, membership: member ? { role: member.role, status: member.status } : null, canModerate: Boolean(canModerate),
        posts: posts.map(({ _count, body, ...post }, index) => ({ ...post, ...reactions[index], excerpt: post.spoiler ? "" : body.slice(0, 240), commentCount: _count.comments })),
        page, hasMore: count > page * 20, members, reports: reports.map(report => ({ ...report, postId: report.targetType === "post" ? report.targetId : reportedComments.find(comment => comment.id === report.targetId)?.postId ?? null })) };
    },
    async post(slug: string, postId: string, viewerId: string | null, page: number) {
      const row = await community(db, slug);
      const post = await db.communityPost.findFirst({ where: { id: postId, communityId: row.id, status: "published", author: visibleAuthor(viewerId) },
        select: { id: true, title: true, body: true, ...postAttributes, createdAt: true, editedAt: true, revision: true, author: { select: authorSelect } } });
      if (!post) throw new CommunityError("Paylaşım bulunamadı.", 404);
      const where = { postId, status: "published", author: visibleAuthor(viewerId) };
      const [comments, count] = await Promise.all([
        db.communityComment.findMany({ where, orderBy: [{ createdAt: "asc" }, { id: "asc" }], skip: (page - 1) * 40, take: 40,
          select: { id: true, body: true, createdAt: true, author: { select: authorSelect } } }), db.communityComment.count({ where }),
      ]);
      const reactions = await communityReactionMetrics(db, row, [post], viewerId);
      return { post: { ...post, ...reactions[0] }, comments, page, hasMore: count > page * 40 };
    },
    async mutate(slug: string, userId: string, body: Record<string, unknown>) {
      const note = moderationNote(body.moderationNote);
      return db.$transaction(async tx => {
        await lockActiveAccount(tx, userId);
        await activeUser(tx, userId);
        const row = await community(tx, slug);
        const key = { communityId: row.id, userId };
        if (body.action === "set-like" || body.action === "set-save") return setCommunityPostReaction(tx, row, userId, body);
        if (body.action === "join") {
          if (row.status !== "active") throw new CommunityError("Arşivdeki topluluğa katılamazsın.", 409);
          const existing = await tx.communityMember.findUnique({ where: { communityId_userId: key } });
          if (existing?.status === "banned") throw new CommunityError("Bu topluluğa katılımın kapatılmış.", 403);
          await tx.communityMember.upsert({ where: { communityId_userId: key }, update: {}, create: key });
          return { ok: true };
        }
        const actor = await membership(tx, row.id, userId, body.action === "leave");
        if (body.action === "update-discovery") {
          if (!staff(actor.role)) throw new CommunityError("Keşif bilgilerini değiştirme yetkin yok.", 403);
          const data = communityDiscoveryInput(body);
          if (Object.entries(data).every(([key, value]) => row[key as keyof typeof row] === value)) return { ok: true };
          await tx.community.update({ where: { id: row.id }, data });
          await recordCommunityAction(tx, row.id, userId, "update-discovery", "community", row.id, note);
          return { ok: true };
        }
        if (body.action === "leave") {
          if (actor.role === "owner") throw new CommunityError("Kurucu kendi topluluğundan ayrılamaz.", 409);
          await tx.communityMember.delete({ where: { communityId_userId: key } });
          await tx.communityPostLike.deleteMany({ where: { userId, post: { communityId: row.id } } });
          await tx.communityOwnershipOffer.deleteMany({ where: { communityId: row.id, toUserId: userId } });
          await tx.communityEventRsvp.updateMany({ where: { userId, event: { communityId: row.id }, status: { in: ["attending", "interested"] } }, data: { status: "withdrawn" } });
          return { ok: true };
        }
        if (body.action === "create-post") {
          if ((body.reference !== undefined || body.catalogSelection !== undefined) && body.type !== "review") throw new CommunityError("Eser seçimi yalnız incelemeler içindir.");
          if (body.reference !== undefined && body.catalogSelection !== undefined) throw new CommunityError("Tek bir eser seçim yöntemi kullan.");
          const reference = body.catalogSelection !== undefined ? resolveCatalogReviewReference(userId, body.catalogSelection, body.reviewKind) : body.reference !== undefined ? await resolveReviewReference(tx, userId, body.reference, body.reviewKind) : null;
          const data = communityPostInput(reference ? { ...body, subjectTitle: reference.title, sourceUrl: "", reviewKind: reference.reviewKind } : body);
          const post = await tx.communityPost.create({ data: { communityId: row.id, authorId: userId,
            ...data, ...(reference ? { sourceUrl: reference.sourceUrl, referenceProvider: reference.provider } : { referenceProvider: null }) }, select: { id: true } });
          return { post };
        }
        if (body.action === "moderate-member") {
          if (!staff(actor.role)) throw new CommunityError("Topluluk yönetimi yetkin yok.", 403);
          const targetId = text(body.userId, "Üye", 1, 100);
          const target = await tx.communityMember.findUnique({ where: { communityId_userId: { communityId: row.id, userId: targetId } } });
          if (!target) throw new CommunityError("Üye bulunamadı.", 404);
          if (target.role === "owner" || targetId === userId || (actor.role !== "owner" && target.role === "moderator")) throw new CommunityError("Bu üyenin yetkisini değiştiremezsin.", 403);
          if (!await tx.userList.findFirst({ where: { id: targetId, status: "active" }, select: { id: true } })) throw new CommunityError("Üye bulunamadı.", 404);
          if ((body.operation === "promote" || body.operation === "demote") && actor.role !== "owner") throw new CommunityError("Rol değiştirme yetkin yok.", 403);
          if ((body.operation === "ban" && target.status === "banned") || (body.operation === "unban" && target.status === "active") || (body.operation === "promote" && target.role === "moderator") || (body.operation === "demote" && target.role === "member")) return { ok: true };
          if (body.operation === "ban" || body.operation === "unban") {
            await tx.communityMember.update({ where: { communityId_userId: { communityId: row.id, userId: targetId } }, data: { status: body.operation === "ban" ? "banned" : "active", role: "member" } });
            if (body.operation === "ban") await tx.communityEventRsvp.updateMany({ where: { userId: targetId, event: { communityId: row.id }, status: { in: ["attending", "interested"] } }, data: { status: "withdrawn" } });
            if (body.operation === "ban") await tx.communityPostLike.deleteMany({ where: { userId: targetId, post: { communityId: row.id } } });
            if (body.operation === "ban") await tx.communityOwnershipOffer.deleteMany({ where: { communityId: row.id, toUserId: targetId } });
          } else if (actor.role === "owner" && target.status === "active" && (body.operation === "promote" || body.operation === "demote")) {
            await tx.communityMember.update({ where: { communityId_userId: { communityId: row.id, userId: targetId } }, data: { role: body.operation === "promote" ? "moderator" : "member" } });
          } else throw new CommunityError("Geçersiz üye işlemi.");
          await recordCommunityAction(tx, row.id, userId, String(body.operation), "member", targetId, note);
          return { ok: true };
        }
        if (body.action === "resolve-report") {
          if (!staff(actor.role)) throw new CommunityError("Topluluk yönetimi yetkin yok.", 403);
          const reportId = text(body.reportId, "Bildirim", 1, 100);
          const report = await tx.communityReport.findFirst({ where: { id: reportId, communityId: row.id, status: "pending" }, select: { targetType: true, targetId: true } });
          if (!report) throw new CommunityError("Bildirim bulunamadı.", 404);
          const updated = await reviewCommunityReports(tx, { id: reportId, communityId: row.id }, userId);
          if (!updated.count) throw new CommunityError("Bildirim bulunamadı.", 404);
          await recordCommunityAction(tx, row.id, userId, "resolve-report", report.targetType, report.targetId, note);
          return { ok: true };
        }
        const postId = text(body.postId, "Paylaşım", 1, 100);
        const post = await tx.communityPost.findFirst({ where: { id: postId, communityId: row.id, status: "published", author: visibleAuthor(userId) } });
        if (!post) throw new CommunityError("Paylaşım bulunamadı.", 404);
        if (body.action === "edit-review") {
          if (post.type !== "review") throw new CommunityError("Yalnız incelemeler düzenlenebilir.", 409);
          if (post.authorId !== userId) throw new CommunityError("Yalnız kendi incelemeni düzenleyebilirsin.", 403);
          if (!Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0 || typeof body.spoiler !== "boolean") throw new CommunityError("Geçerli inceleme sürümü ve spoiler tercihi gerekli.");
          if (body.expectedRevision !== post.revision) throw new CommunityError("İnceleme değişmiş. Taslağını koruyup güncel incelemeyi yükle.", 409);
          const parsed = communityPostInput({ type: "review", reviewKind: post.reviewKind, subjectTitle: post.subjectTitle, sourceUrl: "", distribution: post.distribution, title: body.title, body: body.body, rating: body.rating, spoiler: body.spoiler });
          const input = { title: parsed.title, body: parsed.body, rating: parsed.rating, spoiler: parsed.spoiler };
          if (Object.entries(input).every(([key, value]) => post[key as keyof typeof post] === value)) return { ok: true, changed: false };
          const updated = await tx.communityPost.updateMany({ where: { id: post.id, authorId: userId, status: "published", type: "review", revision: post.revision }, data: { ...input, revision: { increment: 1 }, editedAt: new Date() } });
          if (!updated.count) throw new CommunityError("İnceleme değişmiş. Güncel incelemeyi yükle.", 409);
          await recordCommunityAction(tx, row.id, userId, "edit-review", "post", post.id);
          return { ok: true, changed: true };
        }
        if (body.action === "set-distribution") {
          if (post.authorId !== userId && !staff(actor.role)) throw new CommunityError("Bu paylaşımın akış tercihini değiştiremezsin.", 403);
          if (body.distribution === undefined) throw new CommunityError("Akış tercihi gerekli.");
          await tx.communityPost.update({ where: { id: post.id }, data: { distribution: communityDistribution(body.distribution) } });
          return { ok: true };
        }
        if (body.action === "comment") {
          const parsed = normalizeFeedComment(body.body);
          if (!parsed.ok) throw new CommunityError(parsed.error);
          await tx.communityComment.create({ data: { postId, authorId: userId, body: parsed.body } });
          return { ok: true };
        }
        const commentId = body.commentId ? text(body.commentId, "Yorum", 1, 100) : null;
        const comment = commentId ? await tx.communityComment.findFirst({ where: { id: commentId, postId, status: "published", author: visibleAuthor(userId) } }) : null;
        if (commentId && !comment) throw new CommunityError("Yorum bulunamadı.", 404);
        if (body.action === "remove-post" || body.action === "remove-comment") {
          if (body.action === "remove-post" && commentId) throw new CommunityError("Paylaşım işlemine yorum eklenemez.");
          if (body.action === "remove-comment" && !comment) throw new CommunityError("Yorum gerekli.");
          if ((body.action === "remove-comment" ? comment!.authorId : post.authorId) !== userId && !staff(actor.role)) throw new CommunityError("Bu içeriği kaldıramazsın.", 403);
          if (body.action === "remove-comment") await tx.communityComment.update({ where: { id: comment!.id }, data: { status: "removed" } });
          else await tx.communityPost.update({ where: { id: postId }, data: { status: "removed" } });
          await reviewCommunityReports(tx, { communityId: row.id, targetType: commentId ? "comment" : "post", targetId: commentId ?? postId }, userId);
          if (body.action === "remove-post") {
            const children = await tx.communityComment.findMany({ where: { postId }, select: { id: true } });
            await reviewCommunityReports(tx, { communityId: row.id, targetType: "comment", targetId: { in: children.map(child => child.id) } }, userId);
          }
          await recordCommunityAction(tx, row.id, userId, String(body.action), commentId ? "comment" : "post", commentId ?? postId, note);
          return { ok: true };
        }
        if (body.action === "report") {
          if ((comment?.authorId ?? post.authorId) === userId) throw new CommunityError("Kendi içeriğini bildiremezsin.");
          const reason = text(body.reason, "Bildirim nedeni", 3, 300);
          const target = { reporterId: userId, targetType: commentId ? "comment" : "post", targetId: commentId ?? postId };
          await tx.communityReport.upsert({ where: { reporterId_targetType_targetId: target }, update: {}, create: { ...target, communityId: row.id, reason } });
          return { ok: true };
        }
        throw new CommunityError("Geçersiz işlem.");
      });
    },
  };
}
