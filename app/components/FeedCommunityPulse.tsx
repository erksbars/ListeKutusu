"use client";

import Link from "next/link";
import { ArrowUpRight, CheckCircle2, MessageSquareText } from "lucide-react";
import { useEffect, useState } from "react";

type ForumHighlight = {
  id: string;
  slug: string;
  title: string;
  category: string;
  replyCount: number;
  solved: boolean;
  authorName: string;
};

export function FeedCommunityPulse() {
  const [topics, setTopics] = useState<ForumHighlight[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/forum/highlights", { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (Array.isArray(data?.highlights)) setTopics(data.highlights);
      })
      .catch(() => null);
    return () => controller.abort();
  }, []);

  if (topics.length === 0) return null;

  return (
    <section className="feed-community-pulse" aria-labelledby="community-pulse-title">
      <header>
        <div>
          <span className="feed-community-kicker"><MessageSquareText size={14} /> Forumdan</span>
          <h3 id="community-pulse-title">Toplulukta konuşulanlar</h3>
        </div>
        <Link href="/forum">Tüm konular <ArrowUpRight size={14} /></Link>
      </header>
      <div className="feed-community-topics">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/forum/${topic.slug}`} className="feed-community-topic">
            <span>{topic.category}</span>
            <strong>{topic.title}</strong>
            <small>
              {topic.solved && <CheckCircle2 size={13} aria-label="Çözüldü" />}
              {topic.authorName} · {topic.replyCount} yanıt
            </small>
          </Link>
        ))}
      </div>
    </section>
  );
}
