import { Suspense } from "react";
import { SearchResults } from "./SearchResults";

export const metadata = { title: "Ara" };
export default function SearchPage() {
  return <Suspense fallback={<main id="main-content" role="status">Arama yükleniyor…</main>}><SearchResults /></Suspense>;
}
