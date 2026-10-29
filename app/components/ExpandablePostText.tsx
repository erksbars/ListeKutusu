"use client";
import { useId, useState } from "react";
import { Button } from "./ui/Button";
import styles from "./CommunityGeneralFeed.module.css";

export function ExpandablePostText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false), id = useId();
  const long = text.length > 700 || text.split("\n").length > 8;
  return <div><p id={id} className={`${styles.body} ${long && !expanded ? styles.clamped : ""}`}>{text}</p>{long && <Button type="button" variant="ghost" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>{expanded ? "Daha az göster" : "Devamını göster"}</Button>}</div>;
}
