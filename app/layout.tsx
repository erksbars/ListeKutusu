import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./styles/feature-surfaces.css";
import "./styles/forum.css";
import "./styles/interaction-refinements.css";
import "./styles/unified-surfaces.css";
import "./styles/tokens.css";
import "./styles/primitives.css";

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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#080b12" },
  ],
  colorScheme: "light dark",
};

const themeScript = `
  (() => {
    try {
      const stored = localStorage.getItem("listekutusu-theme");
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = stored === "light" || stored === "dark" ? stored : systemDark ? "dark" : "light";
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="skip-link">
          Ana içeriğe geç
        </a>
        {children}
      </body>
    </html>
  );
}
