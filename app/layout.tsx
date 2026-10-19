import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { AmbientMusicBackground } from "./components/AmbientMusicBackground";
import { NavigationProgress } from "./components/NavigationProgress";
import { AppShell } from "./components/AppShell";
import "./globals.css";
import "./styles/feature-surfaces.css";
import "./styles/interaction-refinements.css";
import "./styles/unified-surfaces.css";
import "./styles/tokens.css";
import "./styles/primitives.css";
import "./styles/profile.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://127.0.0.1:3000"),
  title: {
    default: "ListeKutusu",
    template: "%s | ListeKutusu",
  },
  description:
    "Müzik keşiflerini paylaş, kendi listeni oluştur ve topluluğun favorilerini keşfet.",
  applicationName: "ListeKutusu",
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "ListeKutusu",
    title: "ListeKutusu",
    description: "Müzik keşiflerini paylaş, kendi listeni oluştur ve topluluğun favorilerini keşfet.",
  },
  twitter: {
    card: "summary",
    title: "ListeKutusu",
    description: "Müzik keşiflerini paylaş, kendi listeni oluştur ve topluluğun favorilerini keşfet.",
  },
};

export const viewport: Viewport = {
  themeColor: "#080b12",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" data-theme="dark" data-scroll-behavior="smooth">
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="skip-link">
          Ana içeriğe geç
        </a>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AmbientMusicBackground />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
