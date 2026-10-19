import Link from "next/link";
import { TVmazeAttribution } from "@/app/components/TVmazeAttribution";
import { BookOpen, Film, Tv } from "lucide-react";
import type { Profile } from "@/app/(social)/u/[slug]/profileTypes";
import { Card } from "@/app/components/ui/Card";
import styles from "./ProfileMediaShowcase.module.css";

export function ProfileMediaShowcase({ profile }: { profile: Profile }) {
  if (!profile.mediaShowcaseEnabled || profile.blockedByMe || profile.hasBlockedMe) return null;
  const entries = profile.mediaShowcase ?? [];
  if (!entries.length && !profile.isMe) return null;
  const hasTmdb = entries.some(entry => entry.provider === "tmdb");
  return <section className={styles.showcase} aria-labelledby="media-showcase-heading">
    <div className={styles.heading}><div><p className="section-kicker">Müzikten öte</p><h2 id="media-showcase-heading" className="ui-section-title">Film, dizi ve kitap seçimleri</h2></div>{profile.isMe && <Link href="/library?type=movie">Vitrini yönet ↗</Link>}</div>
    {entries.length ? <><p className={styles.meta}>Profil için seçilen son 6 eser. Okuma ve izleme durumları paylaşılmaz.</p><div className={styles.grid}>{entries.map(entry => {
      const Icon = entry.kind === "book" ? BookOpen : entry.kind === "tv" ? Tv : Film;
      const label = entry.kind === "book" ? "Kitap" : entry.kind === "tv" ? "Dizi" : "Film";
      return <Card as="article" key={entry.catalogId} className={styles.card}>
        <span className={styles.kind}><Icon size={18} aria-hidden="true" />{label}{entry.year ? ` · ${entry.year}` : ""}</span>
        <h3>{entry.title}</h3>{entry.creators.length > 0 && <p className={styles.meta}>{entry.creators.join(", ")}</p>}
        <a href={entry.sourceUrl} target="_blank" rel="noopener noreferrer">{entry.provider === "wikidata" ? "Wikidata" : entry.provider === "tvmaze" ? "TVmaze" : entry.provider === "tmdb" ? "TMDB" : "Open Library"} kaydı ↗</a>
      </Card>;
    })}</div>{hasTmdb && <p className={styles.meta}>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>}</> : <p className={styles.meta}>Henüz eser seçmedin. Kitaplığından vitrine eklediğin eserler burada herkese görünür; diğer kayıtların özel kalır.</p>}
    {entries.some(entry => entry.provider === "tvmaze") && <p className={styles.meta}><TVmazeAttribution /></p>}
  </section>;
}
