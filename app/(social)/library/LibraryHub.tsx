"use client";

import { useRouter } from "next/navigation";
import { BookOpen, Film, Library, Music2, Tv } from "lucide-react";
import { PageTopbar } from "@/app/components/PageTopbar";
import { ThemeToggle } from "@/app/components/ThemeToggle";
import { Button } from "@/app/components/ui/Button";
import { LibraryClient } from "./LibraryClient";
import { MusicLibraryPanel } from "./MusicLibraryPanel";

const sections = [
  { value: "music", label: "Müzik", icon: Music2 },
  { value: "tv", label: "Diziler", icon: Tv },
  { value: "movie", label: "Filmler", icon: Film },
  { value: "book", label: "Kitaplar", icon: BookOpen },
] as const;
export type LibrarySection = (typeof sections)[number]["value"];

export function LibraryHub({ section }: { section: LibrarySection }) {
  const router = useRouter();
  return <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app">
    <section className="ui-page-frame relative mx-auto media-library">
      <PageTopbar title="Kitaplığım" subtitle="Müzik, dizi, film ve kitap listelerini buradan yönet." icon={<Library size={20} />} actions={<ThemeToggle />} />
      <div className="library-intro"><div><p className="library-kicker">Kişisel koleksiyon</p><h2 className="ui-section-title">Dört ayrı liste, tek kitaplık.</h2><p>Her tür kendi bölümünde. Mevcut müzik listen ve Spotify bağlantın korunur.</p></div></div>
      <div className="library-types" role="group" aria-label="Kitaplık bölümleri">
        {sections.map(({ value, label, icon: Icon }) => <Button key={value} type="button" variant={section === value ? "primary" : "secondary"} aria-pressed={section === value} leadingIcon={<Icon size={17} aria-hidden="true" />} onClick={() => router.push(`/library?type=${value}`, { scroll: false })}>{label}</Button>)}
      </div>
      {section === "music" ? <MusicLibraryPanel /> : <LibraryClient key={section} kind={section} />}
    </section>
  </main>;
}
