import { LibraryHub, type LibrarySection } from "./LibraryHub";
import "./library.css";

export const metadata = { title: "Kitaplığım · ListeKutusu" };

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const section: LibrarySection = type === "tv" || type === "movie" || type === "book" ? type : "music";
  return <LibraryHub section={section} />;
}
