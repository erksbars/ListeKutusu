"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, Music2, RefreshCw, TriangleAlert } from "lucide-react";
import { PageTopbar } from "./components/PageTopbar";
import { Button, Card } from "./components/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page render failed", error);
  }, [error]);

  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-12 text-white sm:px-6">
      <div className="ui-page-frame mx-auto">
        <PageTopbar title="ListeKutusu" subtitle="Beklenmeyen hata" icon={<Music2 size={18} />} backLabel="Ana sayfaya dön" />
        <Card className="not-found-layout" role="alert">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-300/10 text-rose-200"><TriangleAlert size={26} /></span>
        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-rose-200">Bir sorun oluştu</p>
        <h1 className="mt-3 text-3xl font-black">Bu ekran yüklenemedi.</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-cyan-50/74">
          Verilerin güvende. Bağlantıyı yenileyerek işlemi tekrar deneyebilirsin.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button type="button" onClick={reset} variant="primary" leadingIcon={<RefreshCw size={17} />}>
            Tekrar dene
          </Button>
          <Link href="/" className="secondary-action inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black">
            <Home size={17} /> Ana sayfa
          </Link>
        </div>
        </Card>
      </div>
    </main>
  );
}
