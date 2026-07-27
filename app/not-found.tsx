import Link from "next/link";
import { ArrowLeft, Home, Music2 } from "lucide-react";
import { PageTopbar } from "./components/PageTopbar";
import { Card } from "./components/ui";

export default function NotFound() {
  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-12 text-white sm:px-6">
      <div className="ui-page-frame mx-auto">
        <PageTopbar title="ListeKutusu" subtitle="Sayfa bulunamadı" icon={<Music2 size={18} />} backLabel="Ana sayfaya dön" />
        <Card className="not-found-layout">
          <p className="not-found-code" aria-hidden="true">404</p>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Bu sayfa listede yok.</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-cyan-50/74">
          Bağlantı değişmiş veya içerik kaldırılmış olabilir.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2"><Link href="/" className="primary-action inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black"><Home size={17} /> Ana sayfa</Link><Link href="/account" className="secondary-action inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-black"><ArrowLeft size={17} /> Hesap merkezi</Link></div>
        </Card>
      </div>
    </main>
  );
}
