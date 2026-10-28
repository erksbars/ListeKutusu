"use client";
import type { FeedLocation } from "@/lib/feedNavigation";
import styles from "./SocialSearch.module.css";
const kinds = { all: "Tümü", music: "Müzik", discussion: "Sohbetler", review: "İncelemeler", event: "Etkinlikler" } as const;
export function FeedContentTabs({ value, onChange }: { value: FeedLocation["kind"]; onChange: (value: FeedLocation["kind"]) => void }) {
  return <div className={styles.feedTabs} role="group" aria-label="Akış içerik türü">{(Object.entries(kinds) as [FeedLocation["kind"], string][]).map(([kind, label]) => <button type="button" key={kind} aria-pressed={kind === value} onClick={() => onChange(kind)}>{label}</button>)}</div>;
}
