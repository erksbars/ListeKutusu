import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.E2E_BASE_URL || process.env.APP_URL || "http://127.0.0.1:3000";
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = "Test-Password-42";
const newPassword = "Test-Password-84";
const createdIds = [];
let failures = 0;

class CookieJar {
  cookies = new Map();

  capture(response) {
    const values = response.headers.getSetCookie?.() ?? [response.headers.get("set-cookie")].filter(Boolean);
    for (const value of values) {
      const [pair] = value.split(";");
      const separator = pair.indexOf("=");
      if (separator < 0) continue;
      const name = pair.slice(0, separator);
      const cookieValue = pair.slice(separator + 1);
      if (!cookieValue || /max-age=0/i.test(value)) this.cookies.delete(name);
      else this.cookies.set(name, cookieValue);
    }
  }

  header() {
    return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

function pass(name) {
  console.log(`PASS ${name}`);
}

function fail(name, detail) {
  failures += 1;
  console.error(`FAIL ${name}: ${detail}`);
}

function assert(name, condition, detail = "beklenen koşul sağlanmadı") {
  if (condition) pass(name);
  else fail(name, detail);
}

async function request(jar, path, options = {}) {
  const headers = new Headers(options.headers);
  // This script is a trusted server-side client. Browser-origin enforcement is
  // covered separately by smoke-test.mjs.
  headers.set("x-forwarded-for", `198.51.100.${(runId.length % 180) + 20}`);
  if (jar.header()) headers.set("Cookie", jar.header());
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers, redirect: "manual" });
  jar.capture(response);
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : await response.text();
  return { response, body };
}

async function cleanup() {
  if (!createdIds.length) return;
  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { OR: [{ userId: { in: createdIds } }, { actorId: { in: createdIds } }] } });
    await tx.postReport.deleteMany({ where: { reporterId: { in: createdIds } } });
    await tx.userBlock.deleteMany({ where: { OR: [{ blockerId: { in: createdIds } }, { blockedId: { in: createdIds } }] } });
    await tx.follow.deleteMany({ where: { OR: [{ followerId: { in: createdIds } }, { followingId: { in: createdIds } }] } });
    await tx.feedLike.deleteMany({ where: { userId: { in: createdIds } } });
    await tx.feedListAdd.deleteMany({ where: { userId: { in: createdIds } } });
    await tx.feedSave.deleteMany({ where: { userId: { in: createdIds } } });
    await tx.feedHide.deleteMany({ where: { userId: { in: createdIds } } });
    await tx.feedPost.deleteMany({ where: { authorId: { in: createdIds } } });
    await tx.suggestion.deleteMany({ where: { OR: [{ listId: { in: createdIds } }, { suggestedById: { in: createdIds } }] } });
    await tx.accountSession.deleteMany({ where: { userId: { in: createdIds } } });
    await tx.userList.deleteMany({ where: { id: { in: createdIds } } });
  });
}

const authorJar = new CookieJar();
const readerJar = new CookieJar();
const secondReaderJar = new CookieJar();

try {
  const authorRegistration = await request(authorJar, "/api/accounts", {
    method: "POST",
    body: JSON.stringify({
      ownerName: `E2E Yazar ${runId.slice(-4)}`,
      playlistName: "E2E Yazar Listesi",
      email: `e2e-author-${runId}@example.test`,
      password,
    }),
  });
  assert("Yazar hesabı kaydı", authorRegistration.response.status === 200, JSON.stringify(authorRegistration.body));
  const author = authorRegistration.body.list;
  if (author?.id) createdIds.push(author.id);

  const readerRegistration = await request(readerJar, "/api/accounts", {
    method: "POST",
    body: JSON.stringify({
      ownerName: `E2E Okur ${runId.slice(-4)}`,
      playlistName: "E2E Okur Listesi",
      email: `e2e-reader-${runId}@example.test`,
      password,
    }),
  });
  assert("Okur hesabı kaydı", readerRegistration.response.status === 200, JSON.stringify(readerRegistration.body));
  const reader = readerRegistration.body.list;
  if (reader?.id) createdIds.push(reader.id);

  if (!author?.id || !reader?.id) throw new Error("Test hesapları oluşturulamadı.");

  const secondReaderLogin = await request(secondReaderJar, "/api/accounts/login", {
    method: "POST",
    body: JSON.stringify({ email: `e2e-reader-${runId}@example.test`, password, remember: true }),
  });
  assert("İkinci cihaz oturumu açma", secondReaderLogin.response.status === 200);

  const activeSessions = await request(readerJar, "/api/accounts/sessions");
  assert(
    "Açık oturumları listeleme",
    activeSessions.response.status === 200 &&
      activeSessions.body.sessions?.length === 2 &&
      activeSessions.body.sessions?.filter((item) => item.current).length === 1
  );

  const revokeOtherSessions = await request(readerJar, "/api/accounts/sessions", {
    method: "DELETE",
    body: JSON.stringify({ allOthers: true }),
  });
  const revokedOtherSession = await request(secondReaderJar, "/api/accounts/me");
  assert(
    "Diğer cihaz oturumlarını kapatma",
    revokeOtherSessions.response.status === 200 &&
      revokeOtherSessions.body.revoked === 1 &&
      revokedOtherSession.response.status === 401
  );

  const authorMe = await request(authorJar, "/api/accounts/me");
  assert("Kayıt sonrası yazar oturumu", authorMe.response.status === 200 && authorMe.body.list.id === author.id);
  assert(
    "Yeni hesap başlangıç rehberi",
    authorMe.body.list.onboarding?.profileComplete === false &&
      authorMe.body.list.onboarding?.feedPosts === 0 &&
      authorMe.body.list.onboarding?.feedLikes === 0 &&
      authorMe.body.list.onboarding?.feedAdds === 0
  );

  const profileUpdate = await request(authorJar, "/api/accounts/settings", {
    method: "PATCH",
    body: JSON.stringify({ action: "update-profile", bio: "E2E profil açıklaması", favoriteGenres: ["rock", "caz"], profileTheme: "emerald" }),
  });
  assert("Profil güncelleme", profileUpdate.response.status === 200 && profileUpdate.body.list.profileTheme === "emerald");

  const playlistUpdate = await request(authorJar, "/api/accounts/settings", {
    method: "PATCH",
    body: JSON.stringify({ playlistName: "E2E Güncel Liste" }),
  });
  assert("Liste adı güncelleme", playlistUpdate.response.status === 200 && playlistUpdate.body.list.playlistName === "E2E Güncel Liste");

  const longPlaylistName = await request(authorJar, "/api/accounts/settings", {
    method: "PATCH",
    body: JSON.stringify({ playlistName: "x".repeat(81) }),
  });
  assert("Uzun liste adının reddi", longPlaylistName.response.status === 400);

  const importedTrackId = "1Y7VG310Lf5IYP7sVOob4X";
  const trackImport = await request(authorJar, "/api/lists/import", {
    method: "POST",
    body: JSON.stringify({ trackIds: [importedTrackId] }),
  });
  assert(
    "Spotify bağlantısından toplu liste aktarımı",
    trackImport.response.status === 200 && trackImport.body.imported === 1,
    JSON.stringify(trackImport.body)
  );

  const duplicateTrackImport = await request(authorJar, "/api/lists/import", {
    method: "POST",
    body: JSON.stringify({ trackIds: [importedTrackId] }),
  });
  assert(
    "Toplu aktarımda mevcut şarkının yinelenmemesi",
    duplicateTrackImport.response.status === 200 &&
      duplicateTrackImport.body.imported === 0 &&
      duplicateTrackImport.body.existing === 1,
    JSON.stringify(duplicateTrackImport.body)
  );

  const post = await prisma.feedPost.create({
    data: {
      authorId: author.id,
      trackId: `e2e-track-${runId}`,
      trackUri: `spotify:track:e2e-track-${runId}`,
      trackName: "E2E Test Şarkısı",
      artistName: "E2E Sanatçı",
      albumName: "E2E Albüm",
      durationMs: 180000,
      externalUrl: "https://open.spotify.com/",
      source: "test",
      note: "Kalıcı olmayan test paylaşımı",
      tags: JSON.stringify(["e2e", "test"]),
    },
  });

  const follow = await request(readerJar, "/api/profiles/follow", {
    method: "POST",
    body: JSON.stringify({ profileId: author.id }),
  });
  assert("Profil takip etme", follow.response.status === 200 && follow.body.following === true && follow.body.followerCount === 1);

  const like = await request(readerJar, "/api/feed/likes", {
    method: "POST",
    body: JSON.stringify({ postId: post.id }),
  });
  assert("Akış paylaşımını beğenme", like.response.status === 200 && like.body.liked === true && like.body.likeCount === 1);

  const selfLike = await request(authorJar, "/api/feed/likes", {
    method: "POST",
    body: JSON.stringify({ postId: post.id }),
  });
  assert("Kendi paylaşımını beğenme engeli", selfLike.response.status === 400);

  const add = await request(readerJar, "/api/feed/add", {
    method: "POST",
    body: JSON.stringify({ postId: post.id }),
  });
  assert("Akış şarkısını kişisel listeye ekleme", add.response.status === 200 && add.body.added === true, JSON.stringify(add.body));

  const leaderboard = await request(readerJar, "/api/leaderboard");
  const rankedTrack = leaderboard.body.tracks?.find((item) => item.trackId === post.trackId);
  assert(
    "En çok eklenen şarkılar sıralaması",
    leaderboard.response.status === 200 &&
      rankedTrack?.adds === 1 &&
      !Object.prototype.hasOwnProperty.call(leaderboard.body, "lists"),
    JSON.stringify(leaderboard.body)
  );

  const readerOnboarding = await request(readerJar, "/api/accounts/me");
  assert(
    "Başlangıç rehberi etkinlik ilerlemesi",
    readerOnboarding.response.status === 200 &&
      readerOnboarding.body.list.onboarding?.feedLikes === 1 &&
      readerOnboarding.body.list.onboarding?.feedAdds === 1
  );

  const feed = await request(readerJar, "/api/feed?take=10");
  const visiblePost = feed.body.posts?.find((item) => item.id === post.id);
  assert("Kişiselleştirilmiş akış durumu", feed.response.status === 200 && visiblePost?.likedByMe && visiblePost?.addedByMe && visiblePost?.followingAuthor);

  const personalizedFeed = await request(readerJar, "/api/feed?scope=personalized&take=10");
  const recommendedPost = personalizedFeed.body.posts?.find((item) => item.id === post.id);
  assert(
    "Sana özel akış sıralaması",
    personalizedFeed.response.status === 200 &&
      recommendedPost?.recommendationReason === "Daha önce eklediğin sanatçı"
  );

  const dailyGoals = await request(readerJar, "/api/daily-goals");
  assert(
    "Günlük ritim hedefleri",
    dailyGoals.response.status === 200 &&
      dailyGoals.body.completedCount === 2 &&
      dailyGoals.body.streak === 1
  );

  const notifications = await request(authorJar, "/api/notifications");
  const notificationTypes = new Set(notifications.body.notifications?.map((item) => item.type));
  assert("Takip, beğeni ve ekleme bildirimleri", notifications.response.status === 200 && notifications.body.unreadCount === 3 && ["follow", "feed_like", "feed_add"].every((type) => notificationTypes.has(type)));

  const markRead = await request(authorJar, "/api/notifications", { method: "PATCH", body: JSON.stringify({}) });
  assert("Bildirimleri okundu işaretleme", markRead.response.status === 200 && markRead.body.updated === 3);

  const preferenceUpdate = await request(authorJar, "/api/notifications", {
    method: "PATCH",
    body: JSON.stringify({ preferences: { follows: true, likes: false, adds: true } }),
  });
  assert(
    "Bildirim tercihlerini kaydetme",
    preferenceUpdate.response.status === 200 && preferenceUpdate.body.preferences?.likes === false
  );

  await request(readerJar, "/api/feed/likes", {
    method: "POST",
    body: JSON.stringify({ postId: post.id }),
  });
  await request(readerJar, "/api/feed/likes", {
    method: "POST",
    body: JSON.stringify({ postId: post.id }),
  });
  const notificationsAfterPreference = await request(authorJar, "/api/notifications");
  assert(
    "Kapatılan bildirim türünü üretmeme",
    notificationsAfterPreference.response.status === 200 &&
      notificationsAfterPreference.body.preferences?.likes === false &&
      !notificationsAfterPreference.body.notifications?.some((item) => item.type === "feed_like")
  );

  const authorRecord = await prisma.userList.findUniqueOrThrow({ where: { id: author.id }, select: { slug: true } });
  const profile = await request(readerJar, `/api/profiles?slug=${encodeURIComponent(authorRecord.slug)}`);
  assert("Sosyal profil sayaçları", profile.response.status === 200 && profile.body.profile.followerCount === 1 && profile.body.profile.totalLikes === 1 && profile.body.profile.totalAdds === 1);

  const achievements = await request(authorJar, "/api/achievements");
  const achievementIds = new Set(achievements.body.unlocked?.map((item) => item.id));
  assert(
    "Sosyal başarımlar",
    achievements.response.status === 200 &&
      ["first-share", "first-like", "first-add", "first-follower"].every((id) => achievementIds.has(id))
  );

  const savePost = await request(readerJar, "/api/feed/saves", {
    method: "POST",
    body: JSON.stringify({ postId: post.id }),
  });
  const savedFeed = await request(readerJar, "/api/feed?scope=saved");
  assert(
    "Akış paylaşımını kaydetme",
    savePost.response.status === 200 &&
      savePost.body.saved === true &&
      savedFeed.body.posts?.some((item) => item.id === post.id && item.savedByMe === true)
  );

  const hidePost = await request(readerJar, "/api/feed/hides", {
    method: "POST",
    body: JSON.stringify({ postId: post.id }),
  });
  const feedAfterHide = await request(readerJar, "/api/feed");
  const savedAfterHide = await request(readerJar, "/api/feed?scope=saved");
  assert(
    "İlgilenilmeyen paylaşımı tüm akışlardan gizleme",
    hidePost.response.status === 200 &&
      hidePost.body.hidden === true &&
      !feedAfterHide.body.posts?.some((item) => item.id === post.id) &&
      !savedAfterHide.body.posts?.some((item) => item.id === post.id)
  );

  const blockAuthor = await request(readerJar, "/api/profiles/block", {
    method: "POST",
    body: JSON.stringify({ profileId: author.id }),
  });
  assert("Profili engelleme", blockAuthor.response.status === 200 && blockAuthor.body.blocked === true);

  const blockedAccounts = await request(readerJar, "/api/profiles/block");
  assert(
    "Engellenen hesapları listeleme",
    blockedAccounts.response.status === 200 &&
      blockedAccounts.body.users?.some((item) => item.id === author.id)
  );

  const unblockAuthor = await request(readerJar, "/api/profiles/block", {
    method: "POST",
    body: JSON.stringify({ profileId: author.id }),
  });
  assert("Profil engelini kaldırma", unblockAuthor.response.status === 200 && unblockAuthor.body.blocked === false);

  const forumCreate = await request(authorJar, "/api/forum", {
    method: "POST",
    body: JSON.stringify({
      category: "gitar",
      title: `E2E gitar kayıt sorusu ${runId.slice(-4)}`,
      body: "Evde gitar kaydı alırken dip gürültüsünü azaltmak için hangi bağlantı düzenini önerirsiniz?",
    }),
  });
  assert(
    "Forum konusunu moderasyona gönderme",
    forumCreate.response.status === 200 && forumCreate.body.thread?.status === "pending",
    JSON.stringify(forumCreate.body)
  );
  const forumThread = forumCreate.body.thread;

  const pendingForumList = await request(readerJar, "/api/forum");
  assert(
    "Onay bekleyen forum konusunun herkese kapalı olması",
    pendingForumList.response.status === 200 &&
      !pendingForumList.body.threads?.some((item) => item.id === forumThread?.id)
  );

  const ownerPendingThread = await request(authorJar, `/api/forum/${forumThread?.slug}`);
  assert(
    "Konu sahibinin onay bekleyen konusunu görebilmesi",
    ownerPendingThread.response.status === 200 && ownerPendingThread.body.thread?.isAuthor === true
  );

  if (forumThread?.id) {
    await prisma.forumThread.update({
      where: { id: forumThread.id },
      data: { status: "published", approvedAt: new Date(), lastActivityAt: new Date() },
    });
  }
  const publishedForumList = await request(readerJar, "/api/forum?category=gitar");
  assert(
    "Onaylanan forum konusunun yayınlanması",
    publishedForumList.response.status === 200 &&
      publishedForumList.body.threads?.some((item) => item.id === forumThread?.id)
  );
  assert(
    "Forum listesinin sayfalama ve özet bilgileri",
    publishedForumList.body.pagination?.page === 1 &&
      publishedForumList.body.pagination?.total >= 1 &&
      publishedForumList.body.summary?.threadCount >= 1 &&
      Array.isArray(publishedForumList.body.recentThreads)
  );

  const firstForumView = await request(readerJar, `/api/forum/${forumThread?.slug}`);
  const repeatedForumView = await request(readerJar, `/api/forum/${forumThread?.slug}`);
  assert(
    "Aynı ziyaret içinde forum görüntülenmesini tek sayma",
    firstForumView.response.status === 200 &&
      repeatedForumView.response.status === 200 &&
      repeatedForumView.body.thread?.views === firstForumView.body.thread?.views
  );

  const forumReply = await request(readerJar, `/api/forum/${forumThread?.slug}/replies`, {
    method: "POST",
    body: JSON.stringify({ body: "Ses kartını doğrudan bağlayıp gain seviyesini kontrollü artırmayı deneyebilirsin." }),
  });
  assert(
    "Forum konusuna yanıt verme",
    forumReply.response.status === 200 && forumReply.body.reply?.authorId === reader.id,
    JSON.stringify(forumReply.body)
  );

  const forumNotifications = await request(authorJar, "/api/notifications");
  assert(
    "Forum yanıtı bildirimi",
    forumNotifications.response.status === 200 &&
      forumNotifications.body.notifications?.some((item) => item.type === "forum_reply" && item.forumThread?.slug === forumThread?.slug)
  );

  const acceptForumReply = await request(
    authorJar,
    `/api/forum/replies/${forumReply.body.reply?.id}/accept`,
    { method: "POST" }
  );
  const solvedForumThread = await request(authorJar, `/api/forum/${forumThread?.slug}`);
  const solvedForumList = await request(readerJar, "/api/forum?state=solved");
  const solutionNotifications = await request(readerJar, "/api/notifications");
  assert(
    "Forum yanıtını çözüm olarak işaretleme",
    acceptForumReply.response.status === 200 &&
      acceptForumReply.body.accepted === true &&
      solvedForumThread.body.thread?.acceptedReplyId === forumReply.body.reply?.id &&
      solvedForumList.body.threads?.some((item) => item.id === forumThread?.id && item.solved) &&
      solutionNotifications.body.notifications?.some(
        (item) => item.type === "forum_solution" && item.forumThread?.slug === forumThread?.slug
      )
  );

  const forumReplyDelete = await request(readerJar, `/api/forum/replies/${forumReply.body.reply?.id}`, { method: "DELETE" });
  assert("Kendi forum yanıtını kaldırma", forumReplyDelete.response.status === 200 && forumReplyDelete.body.removed === true);
  const reopenedForumThread = await request(authorJar, `/api/forum/${forumThread?.slug}`);
  assert(
    "Kabul edilen yanıt kaldırılınca konuyu yeniden açma",
    reopenedForumThread.response.status === 200 &&
      reopenedForumThread.body.thread?.acceptedReplyId === null
  );

  const exportResponse = await request(authorJar, "/api/accounts/export");
  assert(
    "Kullanıcı verisi dışa aktarma",
    exportResponse.response.status === 200 &&
      exportResponse.response.headers.get("content-disposition")?.includes("attachment") &&
      exportResponse.body.account?.notifyLikes === false &&
      Array.isArray(exportResponse.body.account?.sessions) &&
      Array.isArray(exportResponse.body.account?.reportsMade) &&
      Array.isArray(exportResponse.body.account?.forumThreads) &&
      Array.isArray(exportResponse.body.account?.forumReplies) &&
      Array.isArray(exportResponse.body.account?.feedSaves) &&
      Array.isArray(exportResponse.body.account?.feedHides)
  );

  const passwordChange = await request(authorJar, "/api/accounts/settings", {
    method: "PATCH",
    body: JSON.stringify({ action: "change-password", currentPassword: password, newPassword }),
  });
  assert("Şifre değişimi ve oturum iptali", passwordChange.response.status === 200 && passwordChange.body.signedOut === true);

  const revokedSession = await request(authorJar, "/api/accounts/me");
  assert("İptal edilen oturumun reddi", revokedSession.response.status === 401);

  const oldPasswordLogin = await request(authorJar, "/api/accounts/login", {
    method: "POST",
    body: JSON.stringify({ email: `e2e-author-${runId}@example.test`, password, remember: false }),
  });
  assert("Eski şifrenin reddi", oldPasswordLogin.response.status === 401);

  const newPasswordLogin = await request(authorJar, "/api/accounts/login", {
    method: "POST",
    body: JSON.stringify({ email: `e2e-author-${runId}@example.test`, password: newPassword, remember: false }),
  });
  assert("Yeni şifreyle tekrar giriş", newPasswordLogin.response.status === 200);

  const deleteAccount = await request(authorJar, "/api/accounts/delete", {
    method: "DELETE",
    body: JSON.stringify({ password: newPassword, confirmation: "HESABIMI SİL" }),
  });
  assert("Hesabı kalıcı silme", deleteAccount.response.status === 200 && deleteAccount.body.deleted === true);

  const logout = await request(readerJar, "/api/accounts/logout", { method: "POST" });
  const loggedOutMe = await request(readerJar, "/api/accounts/me");
  assert("Çıkış sonrası oturum reddi", logout.response.status === 200 && loggedOutMe.response.status === 401);
} catch (error) {
  fail("Uçtan uca test çalışması", error instanceof Error ? error.stack || error.message : String(error));
} finally {
  try {
    await cleanup();
    pass("Geçici test verilerini temizleme");
  } catch (error) {
    fail("Geçici test verilerini temizleme", error instanceof Error ? error.message : String(error));
  }
  await prisma.$disconnect();
}

if (failures > 0) {
  console.error(`\n${failures} uçtan uca kontrol başarısız.`);
  process.exitCode = 1;
} else {
  console.log("\nTüm oturumlu hesap ve sosyal akış kontrolleri başarılı.");
}
