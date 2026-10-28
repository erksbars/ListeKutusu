import Link from "next/link";
import { Search } from "lucide-react";

export function ProfileSearch() {
  return <Link href="/search" className="topbar-icon-button" aria-label="ListeKutusu’nda ara"><Search size={19} aria-hidden="true" /></Link>;
}
