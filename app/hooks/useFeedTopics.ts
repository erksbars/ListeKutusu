"use client";

import { useMemo, useState } from "react";

type TaggedPost = { tags: string[] };

export function useFeedTopics<T extends TaggedPost>(posts: T[]) {
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.tags) {
        const normalized = tag.trim().toLocaleLowerCase("tr-TR");
        if (normalized) counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "tr-TR"))
      .slice(0, 6)
      .map(([tag]) => tag);
  }, [posts]);

  const visiblePosts = useMemo(
    () => activeTopic
      ? posts.filter((post) => post.tags.some(
          (tag) => tag.trim().toLocaleLowerCase("tr-TR") === activeTopic
        ))
      : posts,
    [activeTopic, posts]
  );

  return { activeTopic, setActiveTopic, topics, visiblePosts };
}

