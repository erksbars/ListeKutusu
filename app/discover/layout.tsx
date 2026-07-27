import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keşfet",
  description: "Topluluğun yükselen şarkılarını, aktif küratörlerini ve müzik konularını keşfet.",
  alternates: { canonical: "/discover" },
};

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return children;
}
