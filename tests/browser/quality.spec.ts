import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { FORUM_CATEGORY_GROUPS } from "../../lib/forum";

const themes = ["dark", "light"] as const;
const qualityRoutes = [
  ["ana-akis", "/"],
  ["hesap", "/account"],
  ["kesfet", "/discover"],
  ["forum", "/forum"],
  ["oyunlar", "/games"],
  ["hukuk", "/legal"],
  ["liste-kontrolu", "/control"],
  ["sarki-oner", "/suggest"],
  ["yonetim", "/admin"],
  ["forum-moderasyonu", "/admin/forum"],
] as const;

async function openStablePage(page: Page, path: string, theme: (typeof themes)[number]) {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
  await page.addInitScript((selectedTheme) => {
    window.localStorage.setItem("listekutusu-theme", selectedTheme);
  }, theme);

  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `${path} HTTP durum kodu`).toBeLessThan(500);
  if (path === "/suggest") {
    await page.waitForURL(/\/account(?:\?|$)/u);
  }
  const mainContent = page.locator("#main-content");
  await expect(mainContent).toHaveCount(1);
  await mainContent.waitFor({ state: "visible" });
  await page.addStyleTag({
    content: "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;scroll-behavior:auto!important}",
  });
  await page.waitForTimeout(350);
  await page.evaluate(() => document.fonts.ready);

  expect(await page.locator("html").getAttribute("data-theme")).toBe(theme);
  expect(pageErrors, `${path} JavaScript hataları`).toEqual([]);
}

const dashboardSuggestions = [
  { id: "pending-1", trackName: "Nightcall", artistName: "Kavinsky", suggestedBy: "Ece", status: "pending" },
  { id: "pending-2", trackName: "Teardrop", artistName: "Massive Attack", suggestedBy: "Mert", status: "pending" },
  { id: "approved-1", trackName: "Dreams", artistName: "Fleetwood Mac", suggestedBy: "Selin", status: "approved" },
  { id: "rejected-1", trackName: "Sample Track", artistName: "Demo Artist", suggestedBy: "Can", status: "rejected" },
  { id: "removed-1", trackName: "Old Song", artistName: "Archive", suggestedBy: "Ada", status: "removed" },
];

const longDashboardSuggestions = [
  ...Array.from({ length: 14 }, (_, index) => ({
    id: `long-pending-${index + 1}`,
    trackName: index === 2 ? "Gökyüzünün Altında Uzun Bir Gece Yolculuğu" : `Gece Seçkisi ${index + 1}`,
    artistName: index === 2 ? "İstanbul Deneysel Müzik Topluluğu" : `Sanatçı ${index + 1}`,
    suggestedBy: index % 3 === 0 ? "Topluluk üyesi" : `Dinleyici ${index + 1}`,
    status: "pending",
  })),
  ...Array.from({ length: 20 }, (_, index) => ({
    id: `long-decision-${index + 1}`,
    trackName: `Arşiv Parçası ${index + 1}`,
    artistName: `Kolektif ${index + 1}`,
    suggestedBy: `Üye ${index + 1}`,
    status: index % 3 === 0 ? "rejected" : index % 3 === 1 ? "approved" : "removed",
  })),
];

async function mockAccountDashboard(page: Page, initialSuggestions = dashboardSuggestions) {
  let suggestions = initialSuggestions.map((suggestion) => ({ ...suggestion }));
  let lastMutation: { id: string; action: string } | null = null;

  await page.route("**/api/accounts/me**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        list: {
          id: "visual-user",
          slug: "deniz-kaya",
          ownerName: "Deniz Kaya",
          playlistName: "Gece Yolculuğu",
          bio: "Rock, elektronik ve yeni sesler.",
          favoriteGenres: JSON.stringify(["rock", "elektronik"]),
          profileTheme: "aurora",
          role: "member",
          email: "deniz@example.com",
          submitCode: "EKLE-VISUAL1",
          spotifyPlaylistId: null,
          spotifyExternalUrl: null,
          lastExportedAt: null,
          onboarding: { profileComplete: true, feedPosts: 4, feedLikes: 8, feedAdds: 6 },
          suggestions,
        },
      }),
    });
  });
  await page.route("**/api/accounts/decide", async (route) => {
    const body = route.request().postDataJSON() as { id?: string; action?: string };
    lastMutation = { id: body.id ?? "", action: body.action ?? "" };
    const nextStatus = body.action === "approve" ? "approved" : body.action === "remove" ? "removed" : "rejected";
    suggestions = suggestions.map((suggestion) =>
      suggestion.id === body.id ? { ...suggestion, status: nextStatus } : suggestion
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ ok: true }),
    });
  });
  await page.route("**/api/leaderboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        users: [{ id: "visual-user", rank: 12, score: 38, socialLikes: 8, socialAdds: 6 }],
      }),
    });
  });

  return { getLastMutation: () => lastMutation };
}

const visualDate = "2026-07-21T18:30:00.000Z";

async function mockAuthenticatedSocialAccount(page: Page) {
  await page.route("**/api/accounts/me**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      list: {
        id: "social-user",
        slug: "sosyal-kurator",
        ownerName: "Sosyal Küratör",
        email: "kurator@example.com",
        role: "member",
        onboarding: {
          profileComplete: true,
          feedPosts: 4,
          feedLikes: 8,
          feedAdds: 6,
        },
      },
    }),
  }));
  await page.route("**/api/achievements", (route) => route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ achievements: [] }),
  }));
}

async function mockFilledProfile(page: Page) {
  await page.route("**/api/accounts/me**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      list: {
        id: "profile-user",
        slug: "deniz-kaya",
        ownerName: "Deniz Kaya",
        email: "deniz@example.com",
        role: "member",
      },
    }),
  }));
  await page.route("**/api/profiles?**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      profile: {
        id: "profile-user",
        ownerName: "Deniz Kaya",
        playlistName: "Gece Yolculuğu",
        bio: "Alternatif rock, elektronik ve şehir gecelerine eşlik eden yeni seslerin peşinde.",
        favoriteGenres: ["alternatif rock", "elektronik", "trip hop"],
        profileTheme: "aurora",
        slug: "deniz-kaya",
        createdAt: visualDate,
        isMe: true,
        following: false,
        blockedByMe: false,
        hasBlockedMe: false,
        followerCount: 128,
        followingCount: 46,
        postCount: 3,
        totalLikes: 284,
        totalAdds: 91,
        achievements: [
          { id: "first-post", title: "İlk keşif", description: "İlk şarkını toplulukla paylaştın.", current: 1, target: 1, progress: 100, unlocked: true },
          { id: "curator", title: "Küratör", description: "Paylaşımların 50 kez listelere eklendi.", current: 91, target: 50, progress: 100, unlocked: true },
        ],
        nextAchievement: {
          id: "community-voice",
          title: "Topluluğun sesi",
          description: "150 takipçiye ulaş.",
          current: 128,
          target: 150,
          progress: 85,
          unlocked: false,
        },
        posts: Array.from({ length: 3 }, (_, index) => ({
          id: `profile-post-${index + 1}`,
          trackName: ["Nightcall", "Teardrop", "Roads"][index],
          artistName: ["Kavinsky", "Massive Attack", "Portishead"][index],
          albumName: ["OutRun", "Mezzanine", "Dummy"][index],
          externalUrl: null,
          note: index === 0 ? "Gece sürüşünün temposunu tek başına değiştiren parçalardan." : null,
          tags: index === 0 ? ["gece", "elektronik"] : ["trip-hop"],
          createdAt: visualDate,
          likeCount: 42 - index * 6,
          addCount: 18 - index * 3,
        })),
      },
    }),
  }));
  await page.route("**/api/notifications**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ notifications: [], unreadCount: 0 }),
  }));
}

async function mockLongFeed(page: Page) {
  await page.route("**/api/accounts/me**", (route) => route.fulfill({ status: 401, body: "{}" }));
  await page.route("**/api/discovery/random?**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      sourceName: "ListeKutusu seçkisi",
      total: 120,
      tracks: Array.from({ length: 5 }, (_, index) => ({
        id: `editorial-${index + 1}`,
        uri: `spotify:track:editorial-${index + 1}`,
        name: `Editör Keşfi ${index + 1}`,
        artist: `Editör Sanatçı ${index + 1}`,
        album: `Seçki ${index + 1}`,
        externalUrl: null,
        durationMs: 198_000 + index * 4_000,
      })),
    }),
  }));
  await page.route(/\/api\/feed(?:\/mixed)?\?/, async (route) => {
    const posts = Array.from({ length: 10 }, (_, index) => ({
      id: `feed-${index + 1}`,
      trackId: `track-${index + 1}`,
      trackName: index === 3 ? "Geceye Karışan Uzun Bir Şarkı Başlığı" : `Topluluk Keşfi ${index + 1}`,
      artistName: index === 3 ? "Bağımsız İstanbul Ses Kolektifi" : `Sanatçı ${index + 1}`,
      albumName: `Albüm ${index + 1}`,
      durationMs: 210_000,
      externalUrl: null,
      source: "community",
      note: index % 3 === 0 ? "Gece yürüyüşlerine yakışan, katmanlı ve sakin ilerleyen bir keşif." : null,
      tags: index % 2 === 0 ? ["alternatif", "gece"] : ["elektronik"],
      createdAt: visualDate,
      likeCount: 34 - index,
      addCount: 16 - index,
      likedByMe: false,
      addedByMe: false,
      savedByMe: false,
      followingAuthor: false,
      isMine: false,
      recommendationReason: index < 2 ? "Toplulukta yükseliyor" : null,
      author: {
        id: `author-${(index % 5) + 1}`,
        ownerName: `Küratör ${(index % 5) + 1}`,
        playlistName: `Liste ${(index % 5) + 1}`,
        slug: `kurator-${(index % 5) + 1}`,
      },
    }));
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ posts, communityItems: [], nextCursor: null, emptyReason: null }),
    });
  });
  await page.route("**/api/leaderboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        rules: { socialLike: 1, socialAdd: 3 },
        period: { startsAt: "2026-07-01T00:00:00.000Z", label: "Temmuz 2026" },
        totals: { score: 824, approved: 96, rejected: 0, socialLikes: 310, socialAdds: 142, participants: 24 },
        users: Array.from({ length: 8 }, (_, index) => ({
          id: `leader-${index + 1}`,
          rank: index + 1,
          ownerName: `Müziksever ${index + 1}`,
          playlistName: `Seçki ${index + 1}`,
          spotifyExternalUrl: null,
          score: 96 - index * 7,
          approved: 12 - index,
          rejected: 0,
          socialLikes: 32 - index,
          socialAdds: 18 - index,
          total: 20,
          approvalRate: 100,
        })),
        tracks: Array.from({ length: 6 }, (_, index) => ({
          trackId: `leader-track-${index + 1}`,
          trackName: `En Çok Eklenen ${index + 1}`,
          artistName: `Sanatçı ${index + 1}`,
          externalUrl: null,
          postId: `feed-${index + 1}`,
          adds: 42 - index * 4,
          likes: 58 - index * 5,
          rank: index + 1,
        })),
      }),
    });
  });
}

async function mockLongForum(page: Page) {
  await page.route("**/api/accounts/me**", (route) => route.fulfill({ status: 401, body: "{}" }));
  await page.route("**/api/forum?**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const requestedPage = Math.max(1, Number.parseInt(requestUrl.searchParams.get("page") || "1", 10));
    const requestedState = requestUrl.searchParams.get("state") || "all";
    const requestedCategory = requestUrl.searchParams.get("category") || "";
    const pageOffset = (requestedPage - 1) * 20;
    const threads = Array.from({ length: 20 }, (_, index) => {
      const position = pageOffset + index + 1;
      const category = requestedCategory || ["genel", "gitar", "ev-studyosu", "ekipman", "muzik-teorisi"][index % 5];
      return {
        id: `thread-${position}`,
        slug: `ornek-forum-konusu-${position}`,
        category,
        title: position === 5 ? "Ev stüdyosunda dip gürültüsünü azaltmak için hangi sırayı izlemeliyim?" : `Topluluk tartışması ${position}`,
        excerpt: "Denediğim yöntemleri ve kullandığım ekipmanı yazdım. Benzer deneyimi olanların önerilerini merak ediyorum.",
        views: 840 - position * 17,
        createdAt: visualDate,
        lastActivityAt: visualDate,
        locked: position === 9,
        solved: requestedState === "solved" ? true : requestedState === "open" ? false : position % 4 === 1,
        replyCount: 18 - (index % 9),
        author: { ownerName: `Forum Üyesi ${(index % 7) + 1}`, slug: `forum-uyesi-${(index % 7) + 1}`, profileTheme: "aurora" },
        latestReply: { createdAt: visualDate, author: { ownerName: `Yanıtlayan ${(index % 6) + 1}` } },
      };
    });
    const directory = FORUM_CATEGORY_GROUPS.map((group) => ({
      ...group,
      categories: group.categories.map((category) => {
        const matching = threads.filter((thread) => thread.category === category.id);
        return {
          ...category,
          threadCount: matching.length,
          replyCount: matching.reduce((total, thread) => total + thread.replyCount, 0),
          latestThread: matching[0]
            ? { slug: matching[0].slug, title: matching[0].title, lastActivityAt: visualDate, authorName: matching[0].author.ownerName, solved: matching[0].solved }
            : null,
        };
      }),
    }));
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        threads,
        directory,
        recentThreads: threads.slice(0, 5).map(({ id, slug, category, title, lastActivityAt, replyCount, solved }) => ({ id, slug, category, title, lastActivityAt, replyCount, solved })),
        summary: { threadCount: 42, replyCount: 286, solvedCount: 11 },
        pagination: { page: requestedPage, pageSize: 20, total: 42, totalPages: 3 },
      }),
    });
  });
}

async function mockLongDiscover(page: Page) {
  await page.route("**/api/accounts/me**", (route) => route.fulfill({ status: 401, body: "{}" }));
  await page.route("**/api/discovery/random?**", (route) => route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      sourceName: "ListeKutusu seçkisi",
      total: 120,
      tracks: Array.from({ length: 5 }, (_, index) => ({
        id: `random-track-${index + 1}`,
        uri: `spotify:track:random-track-${index + 1}`,
        name: index === 2 ? "Geceye Açılan Uzun Bir Yol" : `Rastgele Keşif ${index + 1}`,
        artist: index === 2 ? "Bağımsız İstanbul Ses Kolektifi" : `Keşif Sanatçısı ${index + 1}`,
        album: `Seçki ${index + 1}`,
        externalUrl: null,
        durationMs: 198_000 + index * 7_000,
      })),
    }),
  }));
  await page.route("**/api/discover", async (route) => {
    const tracks = Array.from({ length: 18 }, (_, index) => ({
      id: `discover-${index + 1}`,
      trackId: `discover-track-${index + 1}`,
      trackName: index === 5 ? "Şehrin Işıkları Sönmeden Önce Son Bir Dans" : `Yükselen Keşif ${index + 1}`,
      artistName: index === 5 ? "Anadolu Elektronik Deneyler Topluluğu" : `Sanatçı ${index + 1}`,
      externalUrl: null,
      tags: index % 2 === 0 ? ["alternatif", "gece"] : ["elektronik", "yeni"],
      createdAt: visualDate,
      likeCount: 72 - index * 2,
      addCount: 41 - index,
      likedByMe: false,
      addedByMe: false,
      score: 220 - index * 7,
      author: { id: `discover-author-${(index % 8) + 1}`, ownerName: `Küratör ${(index % 8) + 1}`, slug: `kesif-kuratoru-${(index % 8) + 1}`, profileTheme: "aurora" },
    }));
    const curators = Array.from({ length: 10 }, (_, index) => ({
      id: `curator-${index + 1}`, ownerName: `Aktif Küratör ${index + 1}`, slug: `aktif-kurator-${index + 1}`, profileTheme: "aurora",
      posts: 18 - index, likes: 120 - index * 5, adds: 64 - index * 3, score: 440 - index * 20,
    }));
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        tracks,
        tags: ["alternatif", "elektronik", "rock", "caz", "gece", "yerli", "deneysel", "canlı"].map((tag, index) => ({ tag, posts: 24 - index, engagement: 180 - index * 12 })),
        curators,
        people: curators.map(({ id, ownerName, slug, profileTheme, posts }, index) => ({ id, ownerName, slug, profileTheme, posts, followers: 90 - index * 4 })),
        lists: curators.map(({ id, ownerName, slug, profileTheme }, index) => ({ id: `list-${id}`, name: `Topluluk Seçkisi ${index + 1}`, ownerName, slug, profileTheme, followers: 80 - index * 3, posts: 12, tracks: 48 - index, score: 300 - index * 10 })),
        totals: { posts: 96, tracks: 72, tags: 18, curators: 24, lists: 10 },
      }),
    });
  });
}

async function mockAdminDashboard(page: Page) {
  const pending = Array.from({ length: 4 }, (_, index) => ({
    id: `admin-pending-${index + 1}`, trackName: `Bekleyen Şarkı ${index + 1}`, artistName: `Sanatçı ${index + 1}`,
    suggestedBy: `Üye ${index + 1}`, status: "pending", createdAt: visualDate,
    list: { ownerName: `Liste Sahibi ${(index % 4) + 1}`, spotifyExternalUrl: null },
  }));
  await page.route("**/api/admin/pending", (route) => route.fulfill({
    status: 200, contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ pending, recent: [], queue: { total: 18, shown: 4, limit: 100 } }),
  }));
  await page.route("**/api/admin/settings", (route) => route.fulfill({
    status: 200, contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ settings: { spotifyUserId: "owner-visual", playlistId: "playlist-visual", playlistName: "ListeKutusu Ana Liste" } }),
  }));
  await page.route("**/api/admin/lists?**", (route) => route.fulfill({
    status: 200, contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      lists: Array.from({ length: 4 }, (_, index) => ({
        id: `admin-list-${index + 1}`, ownerName: `Kullanıcı ${index + 1}`, email: `uye${index + 1}@example.com`, role: index === 1 ? "moderator" : "member",
        playlistName: `Kişisel Seçki ${index + 1}`, slug: `kullanici-${index + 1}`, status: "active", spotifyExternalUrl: index % 2 ? null : "https://open.spotify.com/playlist/visual",
        createdAt: visualDate, updatedAt: visualDate, lastExportedAt: index % 2 ? null : visualDate,
        suggestionCount: 32 - index, pendingCount: index + 1, approvedCount: 20 - index,
      })),
      pagination: { page: 1, pageSize: 20, total: 24, totalPages: 2 },
    }),
  }));
  await page.route("**/api/admin/reports?**", (route) => route.fulfill({
    status: 200, contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      reports: Array.from({ length: 2 }, (_, index) => ({
        id: `report-${index + 1}`, reason: "spam", details: "Tekrarlayan veya yanıltıcı paylaşım bildirimi.", createdAt: visualDate, reviewedAt: null, status: "pending",
        reportCount: index + 2, reasons: ["spam", "yanıltıcı"], reporters: [{ ownerName: "Raporlayan", slug: "raporlayan" }], reporter: { ownerName: "Raporlayan", slug: "raporlayan" },
        post: { id: `reported-post-${index + 1}`, trackName: `Bildirilen Şarkı ${index + 1}`, artistName: `Sanatçı ${index + 1}`, note: "İncelenmesi gereken paylaşım notu.", author: { ownerName: `Paylaşan ${index + 1}`, slug: `paylasan-${index + 1}` } },
      })),
      stats: { pending: 4, resolved: 12, dismissed: 3 },
    }),
  }));
  await page.route("**/api/admin/activity?**", (route) => route.fulfill({
    status: 200, contentType: "application/json; charset=utf-8",
    body: JSON.stringify({
      summary: { newAccounts: 18, suggestions: 84, approvedSuggestions: 63, rejectedSuggestions: 12, feedPosts: 46, forumThreads: 21, reports: 7, auditEvents: 124 },
      logs: Array.from({ length: 5 }, (_, index) => ({ id: `audit-${index + 1}`, action: index % 2 ? "suggestion.approve" : "forum.approve", targetType: index % 2 ? "suggestion" : "forum", targetId: `target-${index + 1}`, targetLabel: `İşlem kaydı ${index + 1}`, metadata: null, createdAt: visualDate })),
      pagination: { page: 1, pageSize: 20, total: 34, totalPages: 2 },
    }),
  }));
}

async function mockControlDashboard(page: Page) {
  const genreNames = ["Alternatif rock", "Elektronik", "Caz", "Post-rock"];
  await page.route("**/api/accounts/control", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fulfill({ status: 200, contentType: "application/json; charset=utf-8", body: JSON.stringify({ ok: true }) });
      return;
    }
    const tracks = Array.from({ length: 16 }, (_, index) => {
      const genre = genreNames[index % genreNames.length];
      return {
        id: `control-${index + 1}`,
        trackId: `control-track-${index + 1}`,
        trackName: index === 5 ? "Şehrin Işıkları Altında Uzun Bir Gece" : `Liste Parçası ${index + 1}`,
        artistName: `Sanatçı ${(index % 8) + 1}`,
        durationMs: 192_000 + index * 4_000,
        suggestedBy: null,
        imageUrl: null,
        externalUrl: null,
        album: `Albüm ${(index % 5) + 1}`,
        genres: [genre, index % 2 ? "gece" : "yeni"],
        primaryGenre: genre,
        artists: [{ id: `artist-${(index % 8) + 1}`, name: `Sanatçı ${(index % 8) + 1}`, genres: [genre] }],
      };
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        list: { id: "control-list", ownerName: "Deniz Kaya", playlistName: "Gece Yolculuğu", spotifyExternalUrl: null, lastExportedAt: null },
        tracks,
      }),
    });
  });
}

async function mockAdminForumDashboard(page: Page) {
  await page.route("**/api/admin/forum?**", async (route) => {
    const status = new URL(route.request().url()).searchParams.get("status") || "pending";
    const threads = Array.from({ length: 20 }, (_, index) => ({
      id: `moderation-${index + 1}`,
      slug: `moderasyon-konusu-${index + 1}`,
      category: ["genel", "gitar", "ekipman", "ev-studyosu"][index % 4],
      title: index === 3 ? "Ev stüdyosunda dip gürültüsünü azaltmak için izlenecek adımlar" : `Moderasyon konusu ${index + 1}`,
      body: "Kullanıcının yayınlanmadan önce incelenmesi gereken ayrıntılı forum gönderisi.",
      status,
      createdAt: visualDate,
      lastActivityAt: visualDate,
      views: 120 + index,
      lockedAt: null,
      acceptedReplyId: null,
      author: { ownerName: `Forum Üyesi ${(index % 7) + 1}`, slug: `forum-uyesi-${(index % 7) + 1}` },
      replies: [],
      _count: { replies: index % 6 },
    }));
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        actor: { label: "Deniz Kaya" },
        threads,
        stats: { pending: 20, published: 42, rejected: 7, removed: 3 },
      }),
    });
  });
}

for (const theme of themes) {
  test.describe(`${theme} tema`, () => {
    for (const [name, path] of qualityRoutes) {
      test(`${name}: Axe ve responsive kalite`, async ({ page }) => {
        await openStablePage(page, path, theme);

        const layout = await page.evaluate(() => ({
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          duplicateIds: [...document.querySelectorAll("[id]")]
            .map((element) => element.id)
            .filter((id, index, ids) => ids.indexOf(id) !== index),
        }));

        expect(layout.documentWidth, `${path} document yatay taşması`).toBeLessThanOrEqual(layout.viewportWidth + 1);
        expect(layout.duplicateIds, `${path} yinelenen id değerleri`).toEqual([]);

        const accessibility = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .exclude("nextjs-portal")
          .analyze();

        const violations = accessibility.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          targets: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
        }));
        expect(violations, `${path} Axe ihlalleri`).toEqual([]);
      });
    }
  });
}

test("ana akış: açık temada boş durum okunabilir", async ({ page }) => {
  await page.route(/\/api\/feed(?:\/mixed)?\?/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ posts: [], communityItems: [], nextCursor: null, emptyReason: null }),
    });
  });

  await openStablePage(page, "/", "light");
  const emptyTitle = page.locator(".feed-empty-title");
  await expect(emptyTitle).toBeVisible();
  await expect(emptyTitle).toHaveText("Akış henüz boş");

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal")
    .analyze();
  expect(accessibility.violations).toEqual([]);
});

test("giriş gerektiren akış istemci yönlendirmesiyle hesap sayfasına geçer", async ({ page }, testInfo) => {
  test.skip(!["wide", "mobile"].includes(testInfo.project.name), "İstemci yönlendirmesi geniş ve mobil uçlarda izleniyor.");
  await page.route("**/api/accounts/me**", (route) => route.fulfill({ status: 401, body: "{}" }));
  await page.route(/\/api\/feed(?:\/mixed)?\?/, (route) => route.fulfill({
    status: 200,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ posts: [], communityItems: [], nextCursor: null, emptyReason: null }),
  }));
  await openStablePage(page, "/", "dark");
  await page.evaluate(() => {
    (window as Window & { __listekutusuClientMarker?: string }).__listekutusuClientMarker = "korundu";
  });

  await page.locator(".feed-composer-trigger-button").click();

  await page.waitForURL(/\/account\?mode=login&next=%2F%23feed-composer/u);
  await expect(page.getByRole("heading", { name: "Hesabına dön" })).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as Window & { __listekutusuClientMarker?: string }).__listekutusuClientMarker
    )
  ).toBe("korundu");
});

for (const theme of themes) {
  test(`görsel baseline: dolu profil ${theme}`, async ({ page }, testInfo) => {
    test.skip(true, "Profil verisi artık sunucuda oluşturulduğu için istemci route mock'u bu senaryoda kullanılamaz.");
    test.skip(!["wide", "mobile"].includes(testInfo.project.name), "Profil geniş ve mobil uçlarda izleniyor.");
    await mockFilledProfile(page);
    await openStablePage(page, "/u/deniz-kaya", theme);
    await expect(page.getByRole("heading", { name: "Deniz Kaya" })).toBeVisible();

    await page.getByRole("tab", { name: /Hakkında/u }).click();
    await expect(page).toHaveURL(/\/u\/deniz-kaya\?tab=about$/u);
    await expect(page.getByRole("heading", { name: "Gece Yolculuğu" })).toBeVisible();

    await page.getByRole("tab", { name: /Rozetler/u }).click();
    await expect(page.getByRole("heading", { name: "Kazanılan rozetler" })).toBeVisible();

    await page.getByRole("tab", { name: /Paylaşımlar/u }).click();
    await expect(page).toHaveURL(/\/u\/deniz-kaya$/u);
    const profilePostColumns = await page.locator(".profile-posts-grid").evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        display: style.display,
        columns: style.gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      };
    });
    expect(profilePostColumns.display).toBe("grid");
    expect(profilePostColumns.columns).toBe(testInfo.project.name === "wide" ? 2 : 1);
    const profilePostCards = page.locator(".profile-post-card");
    const firstPostBox = await profilePostCards.nth(0).boundingBox();
    const secondPostBox = await profilePostCards.nth(1).boundingBox();
    expect(firstPostBox).not.toBeNull();
    expect(secondPostBox).not.toBeNull();
    if (testInfo.project.name === "wide") {
      expect(secondPostBox!.x).toBeGreaterThan(firstPostBox!.x + 100);
      expect(Math.abs(secondPostBox!.y - firstPostBox!.y)).toBeLessThan(2);
    } else {
      expect(Math.abs(secondPostBox!.x - firstPostBox!.x)).toBeLessThan(2);
      expect(secondPostBox!.y).toBeGreaterThan(firstPostBox!.y + 100);
    }
    const layout = await page.evaluate(() => ({
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }));
    expect(layout.documentWidth, "Profil document yatay taşması").toBeLessThanOrEqual(layout.viewportWidth + 1);
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .exclude("nextjs-portal")
      .analyze();
    expect(accessibility.violations, "Profil Axe ihlalleri").toEqual([]);
    await expect(page).toHaveScreenshot(`profil-dolu-${theme}.png`, { fullPage: true });
  });
}

for (const theme of themes) {
  for (const [name, path] of [
    ["hesap", "/account"],
    ["hukuk", "/legal"],
  ] as const) {
    test(`görsel baseline: ${name} ${theme}`, async ({ page }) => {
      await openStablePage(page, path, theme);
      await expect(page).toHaveScreenshot(`${name}-${theme}.png`, { fullPage: true });
    });
  }
}

for (const theme of themes) {
  test(`görsel baseline: hesap paneli ${theme}`, async ({ page }) => {
    await mockAccountDashboard(page);
    await openStablePage(page, "/account", theme);
    await expect(page.getByRole("heading", { name: "Gelen öneriler" })).toBeVisible();
    await expect(page).toHaveScreenshot(`hesap-paneli-${theme}.png`, { fullPage: true });
  });
}

for (const theme of themes) {
  test(`görsel baseline: uzun hesap paneli ${theme}`, async ({ page }, testInfo) => {
    test.skip(!["wide", "mobile"].includes(testInfo.project.name), "Uzun veri wide ve mobil uçlarda izleniyor.");
    await mockAccountDashboard(page, longDashboardSuggestions);
    await openStablePage(page, "/account", theme);
    await expect(page.getByRole("heading", { name: "Gelen öneriler" })).toBeVisible();
    await expect(page.locator(".account-request-row")).toHaveCount(8);
    await expect(page.getByRole("button", { name: /Daha fazla istek/u })).toContainText("6");
    await expect(page).toHaveScreenshot(`hesap-paneli-uzun-${theme}.png`, { fullPage: true });
  });
}

test("hesap paneli: uzun istek kuyruğu kademeli olarak açılır", async ({ page }) => {
  await mockAccountDashboard(page, longDashboardSuggestions);
  await openStablePage(page, "/account", "light");

  await expect(page.locator(".account-request-row")).toHaveCount(8);
  await page.getByRole("button", { name: /Daha fazla istek/u }).click();
  await expect(page.locator(".account-request-row")).toHaveCount(14);
  await expect(page.getByRole("button", { name: /Daha fazla istek/u })).toHaveCount(0);
});

test("hesap paneli: onay sonrası kuyruk ve karar geçmişi güncellenir", async ({ page }) => {
  const mock = await mockAccountDashboard(page);
  await openStablePage(page, "/account", "light");

  const pendingRow = page.locator(".account-request-row").filter({ hasText: "Nightcall" });
  await pendingRow.getByRole("button", { name: "Onayla" }).click();

  await expect(pendingRow).toHaveCount(0);
  const decidedRow = page.locator(".account-decision-row").filter({ hasText: "Nightcall" });
  await expect(decidedRow).toContainText("Onaylandı");
  await expect(page.locator(".toast-card")).toContainText("Şarkı onaylandı.");
  expect(mock.getLastMutation()).toEqual({ id: "pending-1", action: "approve" });
});

test("yönetim merkezi: bölümler URL ve görünür içerikle birlikte değişir", async ({ page }) => {
  await mockAdminDashboard(page);
  await openStablePage(page, "/admin", "light");

  await expect(page.getByRole("button", { name: "Genel bakış" })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".admin-activity-report")).toBeVisible();

  await page.getByRole("button", { name: /Moderasyon/u }).click();
  await expect(page).toHaveURL(/\/admin\?view=moderation$/u);
  await expect(page.locator("#admin-moderation-title")).toBeVisible();
  await expect(page.locator(".admin-activity-report")).toHaveCount(0);

  await page.getByRole("button", { name: /Kullanıcılar/u }).click();
  await expect(page).toHaveURL(/\/admin\?view=users$/u);
  await expect(page.locator("#admin-user-lists-title")).toBeVisible();

  await page.getByRole("button", { name: /Öneri kuyruğu/u }).click();
  await expect(page).toHaveURL(/\/admin\?view=queue$/u);
  await expect(page.locator("#admin-pending-title")).toBeVisible();
});

test("liste kontrolü: gruplar gerektiğinde açılıp kapanır", async ({ page }) => {
  await mockControlDashboard(page);
  await openStablePage(page, "/control", "light");

  const groups = page.locator(".control-group");
  await expect(groups).toHaveCount(4);
  await expect(groups.nth(0)).toHaveAttribute("open", "");
  await expect(groups.nth(1)).not.toHaveAttribute("open", "");
  await groups.nth(1).locator("summary").click();
  await expect(groups.nth(1)).toHaveAttribute("open", "");

  await page.getByPlaceholder("Şarkı, sanatçı veya tür ara...").fill("Caz");
  await expect(groups).toHaveCount(1);
  await expect(groups.nth(0)).toHaveAttribute("open", "");
});

test("forum moderasyonu: uzun kuyruk kademeli olarak açılır", async ({ page }) => {
  await mockAdminForumDashboard(page);
  await openStablePage(page, "/admin/forum", "dark");

  await expect(page.locator(".admin-forum-thread")).toHaveCount(12);
  await expect(page.getByRole("button", { name: /Daha fazla konu/u })).toContainText("8");
  await page.getByRole("button", { name: /Daha fazla konu/u }).click();
  await expect(page.locator(".admin-forum-thread")).toHaveCount(20);
  await expect(page.getByRole("button", { name: /Daha fazla konu/u })).toHaveCount(0);
});

test("ana akış: beğeni, kaydetme ve listeye ekleme durumu anında güncellenir", async ({ page }) => {
  await mockLongFeed(page);
  await mockAuthenticatedSocialAccount(page);
  const mutations: Array<{ endpoint: string; targetId: string }> = [];

  await page.route("**/api/feed/likes", async (route) => {
    const body = route.request().postDataJSON() as { postId: string };
    mutations.push({ endpoint: "likes", targetId: body.postId });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ liked: true, likeCount: 35 }),
    });
  });
  await page.route("**/api/feed/saves", async (route) => {
    const body = route.request().postDataJSON() as { postId: string };
    mutations.push({ endpoint: "saves", targetId: body.postId });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ saved: true }),
    });
  });
  await page.route("**/api/feed/add", async (route) => {
    const body = route.request().postDataJSON() as { postId: string };
    mutations.push({ endpoint: "add", targetId: body.postId });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ message: "Şarkı listene eklendi." }),
    });
  });
  await page.route("**/api/profiles/follow", async (route) => {
    const body = route.request().postDataJSON() as { profileId: string };
    mutations.push({ endpoint: "follow", targetId: body.profileId });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ following: true }),
    });
  });

  await openStablePage(page, "/", "light");
  const card = page.locator(".feed-post-card").first();
  await expect(card).toContainText("Topluluk Keşfi 1");

  const likeButton = card.locator(".feed-action-row button").first();
  await expect(likeButton).toHaveAccessibleName("Beğen");
  await likeButton.click();
  await expect(likeButton).toHaveAttribute("aria-pressed", "true");
  await expect(likeButton).toHaveAccessibleName("Beğeniyi kaldır");
  await expect(likeButton).toContainText("35");

  const saveButton = card.locator(".feed-action-row button").nth(2);
  await expect(saveButton).toHaveAccessibleName("Daha sonra kaydet");
  await saveButton.click();
  await expect(page.locator(".toast-card")).toContainText("Paylaşım kaydedildi.");
  await expect(saveButton).toHaveAttribute("aria-pressed", "true");
  await expect(saveButton).toHaveAccessibleName("Kaydı kaldır");

  const followButton = card.locator(".feed-follow-button");
  await expect(followButton).toHaveAccessibleName("Takip et");
  await followButton.click();
  await expect(page.locator(".toast-card")).toContainText("Profil takip edildi.");
  await expect(followButton).toHaveAttribute("aria-pressed", "true");
  await expect(followButton).toHaveAccessibleName("Takipte");

  const addButton = card.locator(".feed-action-row button").nth(1);
  await expect(addButton).toHaveAccessibleName("Şarkıyı listene ekle");
  await addButton.click();
  await expect(addButton).toHaveAccessibleName("Şarkı listende");
  await expect(addButton).toContainText("Listemde");
  await expect(addButton).toContainText("17");
  await expect(page.locator(".toast-card")).toContainText("Şarkı listene eklendi.");

  expect(mutations).toEqual([
    { endpoint: "likes", targetId: "feed-1" },
    { endpoint: "saves", targetId: "feed-1" },
    { endpoint: "follow", targetId: "author-1" },
    { endpoint: "add", targetId: "feed-1" },
  ]);
});

test("masaüstü sol menü: daralır ve kullanıcı tercihini korur", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "wide", "Sol menü masaüstü geniş ekranda doğrulanıyor.");
  await mockLongFeed(page);
  await openStablePage(page, "/", "dark");

  const sidebar = page.locator("#home-sidebar");
  const grid = page.locator("#main-feed");
  const collapseButton = page.getByRole("button", { name: "Sol menüyü daralt" });
  await expect(sidebar).not.toHaveClass(/home-sidebar-collapsed/u);
  await collapseButton.click();
  await expect(sidebar).toHaveClass(/home-sidebar-collapsed/u);
  await expect(grid).toHaveClass(/home-grid-sidebar-collapsed/u);
  await expect(sidebar).toHaveCSS("width", "72px");
  await expect(page.getByRole("button", { name: "Sol menüyü genişlet" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("listekutusu-sidebar-collapsed"))).toBe("true");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#home-sidebar")).toHaveClass(/home-sidebar-collapsed/u);
  await page.getByRole("button", { name: "Sol menüyü genişlet" }).click();
  await expect(page.locator("#home-sidebar")).not.toHaveClass(/home-sidebar-collapsed/u);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("listekutusu-sidebar-collapsed"))).toBe("false");
});

test("masaüstü ana akış: konu etiketleri keşifleri anında süzer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "wide", "Konu filtresi geniş masaüstü akışında doğrulanıyor.");
  await mockLongFeed(page);
  await openStablePage(page, "/", "dark");
  await expect(page.locator(".feed-post-card")).toHaveCount(10);

  const topicButton = page.getByRole("button", { name: "alternatif", exact: true });
  await topicButton.click();
  await expect(topicButton).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".feed-post-card")).toHaveCount(5);

  await page.getByRole("button", { name: "Tümü", exact: true }).click();
  await expect(page.locator(".feed-post-card")).toHaveCount(10);
});

test("bildirimler: aynı paylaşımdaki hareketler gruplanır ve birlikte okundu yapılır", async ({ page }) => {
  await mockLongFeed(page);
  await mockAuthenticatedSocialAccount(page);
  const readRequests: string[][] = [];
  const notificationBase = {
    type: "feed_like",
    readAt: null,
    createdAt: visualDate,
    post: {
      id: "feed-1",
      trackName: "Topluluk Keşfi 1",
      artistName: "Sanatçı 1",
    },
    forumThread: null,
  };
  await page.route("**/api/notifications**", async (route) => {
    if (route.request().method() === "PATCH") {
      const body = route.request().postDataJSON() as { ids?: string[] };
      readRequests.push(body.ids ?? []);
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify({ updated: body.ids?.length ?? 0 }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({
        unreadCount: 3,
        preferences: { follows: true, likes: true, adds: true },
        notifications: ["Deniz", "Ece", "Mert"].map((ownerName, index) => ({
          ...notificationBase,
          id: `notification-${index + 1}`,
          actor: {
            id: `actor-${index + 1}`,
            ownerName,
            slug: ownerName.toLocaleLowerCase("tr-TR"),
            profileTheme: "aurora",
          },
        })),
      }),
    });
  });

  await openStablePage(page, "/", "dark");
  await page.getByTestId("notification-trigger").click();
  const panel = page.getByTestId("notification-panel");
  await expect(panel.locator(".notification-item")).toHaveCount(1);
  await expect(panel.locator(".notification-group-count")).toHaveText("3");
  await expect(panel.locator(".notification-item-message")).toContainText(
    "Deniz ve 2 kişi, Topluluk Keşfi 1 beğendi."
  );

  await panel.locator(".notification-item").click();
  await expect.poll(() => readRequests).toEqual([
    ["notification-1", "notification-2", "notification-3"],
  ]);
});

test("keşfet: beğeni ve listeye ekleme sinyalleri sayaçlarla birlikte güncellenir", async ({ page }) => {
  await mockLongDiscover(page);
  await mockAuthenticatedSocialAccount(page);
  const mutations: Array<{ endpoint: string; postId: string }> = [];

  await page.route("**/api/feed/likes", async (route) => {
    const body = route.request().postDataJSON() as { postId: string };
    mutations.push({ endpoint: "likes", postId: body.postId });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ liked: true, likeCount: 73 }),
    });
  });
  await page.route("**/api/feed/add", async (route) => {
    const body = route.request().postDataJSON() as { postId: string };
    mutations.push({ endpoint: "add", postId: body.postId });
    await route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ message: "Şarkı listene eklendi." }),
    });
  });

  await openStablePage(page, "/discover", "dark");
  const row = page.locator(".discover-track-row").first();
  await expect(row).toContainText("Yükselen Keşif 1");

  const likeButton = row.locator(".discover-track-signals button").first();
  await expect(likeButton).toHaveAccessibleName("Beğen");
  await likeButton.click();
  await expect(likeButton).toHaveAttribute("aria-pressed", "true");
  await expect(likeButton).toHaveAccessibleName("Beğeniyi kaldır");
  await expect(likeButton).toContainText("73");

  const addButton = row.locator(".discover-track-signals button").nth(1);
  await expect(addButton).toHaveAccessibleName("Listene ekle");
  await addButton.click();
  await expect(addButton).toHaveAccessibleName("Listende");
  await expect(addButton).toContainText("42");
  await expect(page.locator(".toast-card")).toContainText("Şarkı listene eklendi.");

  expect(mutations).toEqual([
    { endpoint: "likes", postId: "discover-1" },
    { endpoint: "add", postId: "discover-1" },
  ]);
});

test("keşfet: uzun şarkı listesi kademeli olarak açılır", async ({ page }) => {
  await mockLongDiscover(page);
  await openStablePage(page, "/discover", "dark");

  await expect(page.locator(".discover-track-row")).toHaveCount(10);
  const autoLoad = page.locator(".discover-auto-load");
  await expect(autoLoad).toBeVisible();
  await autoLoad.scrollIntoViewIfNeeded();
  await expect(page.locator(".discover-track-row")).toHaveCount(18);
  await expect(autoLoad).toHaveCount(0);
});

test("ana akış: başarısız optimistic işlemler görsel durumu geri alır", async ({ page }) => {
  await mockLongFeed(page);
  await mockAuthenticatedSocialAccount(page);
  await page.route("**/api/feed/likes", (route) => route.fulfill({
    status: 503,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ error: "Beğeni şu anda güncellenemedi." }),
  }));
  await page.route("**/api/feed/add", (route) => route.fulfill({
    status: 503,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ error: "Şarkı şu anda listene eklenemedi." }),
  }));
  await page.route("**/api/feed/saves", (route) => route.fulfill({
    status: 503,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ error: "Paylaşım şu anda kaydedilemedi." }),
  }));
  await page.route("**/api/profiles/follow", (route) => route.fulfill({
    status: 503,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ error: "Profil şu anda takip edilemedi." }),
  }));

  await openStablePage(page, "/", "dark");
  const card = page.locator(".feed-post-card").first();
  const likeButton = card.locator(".feed-action-row button").first();
  const addButton = card.locator(".feed-action-row button").nth(1);

  await likeButton.click();
  await expect(likeButton).toHaveAttribute("aria-pressed", "false");
  await expect(likeButton).toContainText("34");
  await expect(page.locator(".toast-card")).toContainText("Beğeni şu anda güncellenemedi.");

  const saveButton = card.locator(".feed-action-row button").nth(2);
  await saveButton.click();
  await expect(page.locator(".toast-card")).toContainText("Paylaşım şu anda kaydedilemedi.");
  await expect(saveButton).toHaveAttribute("aria-pressed", "false");
  await expect(saveButton).toHaveAccessibleName("Daha sonra kaydet");

  const followButton = card.locator(".feed-follow-button");
  await followButton.click();
  await expect(page.locator(".toast-card")).toContainText("Profil şu anda takip edilemedi.");
  await expect(followButton).toHaveAttribute("aria-pressed", "false");
  await expect(followButton).toHaveAccessibleName("Takip et");

  await addButton.click();
  await expect(addButton).toHaveAccessibleName("Şarkıyı listene ekle");
  await expect(addButton).toContainText("16");
  await expect(page.locator(".toast-card")).toContainText("Şarkı şu anda listene eklenemedi.");
});

test("keşfet: başarısız optimistic işlemler sayaç ve seçim durumunu geri alır", async ({ page }) => {
  await mockLongDiscover(page);
  await mockAuthenticatedSocialAccount(page);
  await page.route("**/api/feed/likes", (route) => route.fulfill({
    status: 503,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ error: "Beğeni şu anda güncellenemedi." }),
  }));
  await page.route("**/api/feed/add", (route) => route.fulfill({
    status: 503,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify({ error: "Şarkı şu anda listene eklenemedi." }),
  }));

  await openStablePage(page, "/discover", "light");
  const row = page.locator(".discover-track-row").first();
  const likeButton = row.locator(".discover-track-signals button").first();
  const addButton = row.locator(".discover-track-signals button").nth(1);

  await likeButton.click();
  await expect(likeButton).toHaveAttribute("aria-pressed", "false");
  await expect(likeButton).toContainText("72");
  await expect(page.locator(".toast-card")).toContainText("Beğeni şu anda güncellenemedi.");

  await addButton.click();
  await expect(addButton).toHaveAccessibleName("Listene ekle");
  await expect(addButton).toContainText("41");
  await expect(page.locator(".toast-card")).toContainText("Şarkı şu anda listene eklenemedi.");
});

test("forum: durum filtresi ve sayfalama URL ile sonuç listesini birlikte günceller", async ({ page }) => {
  await mockLongForum(page);
  await openStablePage(page, "/forum", "light");

  await page.getByRole("tab", { name: "Çözüldü", exact: true }).click();
  await expect(page).toHaveURL(/state=solved/u);
  await expect(page.locator(".forum-thread-row .forum-solved-badge")).toHaveCount(20);

  await page.getByRole("button", { name: "Sonraki" }).click();
  await expect(page).toHaveURL(/state=solved.*page=2|page=2.*state=solved/u);
  await expect(page.locator(".forum-pagination")).toContainText("2 / 3");
  await expect(page.locator(".forum-thread-row").first()).toContainText("Topluluk tartışması 21");
});

const longSurfaceCases = [
  {
    name: "ana-akis",
    path: "/",
    mock: mockLongFeed,
    ready: async (page: Page) => expect(page.locator(".feed-post-card")).toHaveCount(10),
  },
  {
    name: "forum",
    path: "/forum",
    mock: mockLongForum,
    ready: async (page: Page) => {
      await expect(page.locator("#forum-thread-panel")).toHaveAttribute("aria-busy", "false", { timeout: 15_000 });
      await expect(page.locator(".forum-thread-row")).toHaveCount(20, { timeout: 15_000 });
    },
  },
  {
    name: "kesfet",
    path: "/discover",
    mock: mockLongDiscover,
    ready: async (page: Page) => expect(page.locator(".discover-track-row")).toHaveCount(10),
  },
  {
    name: "yonetim",
    path: "/admin",
    mock: mockAdminDashboard,
    ready: async (page: Page) => expect(page.locator(".admin-section-tabs")).toBeVisible(),
  },
  {
    name: "liste-kontrolu",
    path: "/control",
    mock: mockControlDashboard,
    ready: async (page: Page) => expect(page.locator(".control-group")).toHaveCount(4),
  },
  {
    name: "forum-moderasyonu",
    path: "/admin/forum",
    mock: mockAdminForumDashboard,
    ready: async (page: Page) => expect(page.locator(".admin-forum-thread")).toHaveCount(12),
  },
] as const;

for (const theme of themes) {
  for (const surface of longSurfaceCases) {
    test(`görsel baseline: ${surface.name} dolu ${theme}`, async ({ page }, testInfo) => {
      test.setTimeout(60_000);
      test.skip(!["wide", "mobile"].includes(testInfo.project.name), "Dolu veri wide ve mobil uçlarda izleniyor.");
      await surface.mock(page);
      await openStablePage(page, surface.path, theme);
      await surface.ready(page);
      const viewportWidth = page.viewportSize()?.width ?? 0;
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentWidth, `${surface.path} yatay taşma`).toBeLessThanOrEqual(viewportWidth + 1);
      const accessibility = await new AxeBuilder({ page })
        .disableRules(["color-contrast"])
        .analyze();
      expect(accessibility.violations, `${surface.path} erişilebilirlik ihlalleri`).toEqual([]);
      if (surface.name === "forum-moderasyonu") {
        await expect(page.locator(".admin-forum-thread-main > h3").first()).toHaveCSS(
          "color",
          theme === "light" ? "rgb(17, 29, 37)" : "rgb(255, 255, 255)",
        );
      }
      const fullPage = surface.name !== "ana-akis" && (surface.name !== "yonetim" || testInfo.project.name === "wide");
      await expect(page).toHaveScreenshot(`${surface.name}-dolu-${theme}.png`, { fullPage });
    });
  }
}
