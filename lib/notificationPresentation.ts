export type NotificationPresentationItem = {
  id: string;
  type: "follow" | "feed_like" | "feed_add" | "feed_comment" | "feed_comment_reply" | "forum_reply" | "forum_solution";
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    ownerName: string;
    slug: string;
    profileTheme: string;
  } | null;
  post: {
    id: string;
    trackName: string;
    artistName: string;
  } | null;
  forumThread: {
    slug: string;
    title: string;
  } | null;
};

export type NotificationGroup = {
  key: string;
  items: NotificationPresentationItem[];
  primary: NotificationPresentationItem;
  unreadIds: string[];
};

function targetKey(item: NotificationPresentationItem) {
  if (item.post) return `${item.type}:post:${item.post.id}`;
  if (item.forumThread) return `${item.type}:thread:${item.forumThread.slug}`;
  if (item.actor) return `${item.type}:actor:${item.actor.id}`;
  return `${item.type}:notification:${item.id}`;
}

export function groupNotifications(items: NotificationPresentationItem[]) {
  const groups = new Map<string, NotificationGroup>();

  for (const item of items) {
    const key = targetKey(item);
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
      if (!item.readAt) existing.unreadIds.push(item.id);
      continue;
    }

    groups.set(key, {
      key,
      items: [item],
      primary: item,
      unreadIds: item.readAt ? [] : [item.id],
    });
  }

  return Array.from(groups.values());
}

function actorSummary(group: NotificationGroup) {
  const names = Array.from(
    new Set(
      group.items
        .map((item) => item.actor?.ownerName)
        .filter((name): name is string => Boolean(name))
    )
  );
  const first = names[0] || "Bir kullanıcı";
  const remaining = Math.max(0, names.length - 1);
  return remaining > 0 ? `${first} ve ${remaining} kişi` : first;
}

export function messageForNotificationGroup(group: NotificationGroup) {
  const item = group.primary;
  const actor = actorSummary(group);

  if (item.type === "follow") return `${actor} seni takip etmeye başladı.`;
  if (item.type === "feed_add") {
    const track = item.post?.trackName || "paylaşımındaki şarkıyı";
    return group.items.length > 1
      ? `${actor}, ${track} parçasını listelerine ekledi.`
      : `${actor}, ${track} parçasını listesine ekledi.`;
  }
  if (item.type === "forum_reply") {
    return `${actor}, ${item.forumThread?.title || "forum konuna"} yanıt verdi.`;
  }
  if (item.type === "forum_solution") {
    return `${actor}, ${item.forumThread?.title || "forum konusundaki"} yanıtını çözüm olarak işaretledi.`;
  }
  if (item.type === "feed_comment") {
    return `${actor}, ${item.post?.trackName || "paylaşımına"} yorum yaptı.`;
  }
  if (item.type === "feed_comment_reply") {
    return `${actor}, ${item.post?.trackName || "paylaşımındaki"} yorumuna yanıt verdi.`;
  }
  return `${actor}, ${item.post?.trackName || "paylaşımını"} beğendi.`;
}
