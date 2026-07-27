import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım ve gizlilik",
  description: "ListeKutusu kullanım kuralları, gizlilik yaklaşımı ve puanlama esasları.",
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
