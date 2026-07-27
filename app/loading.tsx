export default function Loading() {
  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-12 text-white sm:px-6" aria-busy="true">
      <div className="loading-shell ui-page-frame mx-auto animate-pulse">
        <div className="flex min-h-16 items-center justify-between border-b border-white/10 py-3">
          <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-white/10" /><div><div className="h-3 w-28 rounded bg-white/16" /><div className="mt-2 h-2 w-20 rounded bg-white/8" /></div></div>
          <div className="h-10 w-24 rounded-xl bg-white/10" />
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_320px]">
          <aside className="hidden space-y-3 lg:block">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-11 rounded-xl bg-white/[0.055]" />)}</aside>
          <section className="space-y-4"><div className="h-36 rounded-2xl bg-white/[0.08]" />{Array.from({ length: 2 }).map((_, index) => <div key={index} className="h-48 rounded-2xl bg-white/[0.075]" />)}</section>
          <aside className="hidden space-y-4 lg:block"><div className="h-56 rounded-2xl bg-white/[0.06]" /><div className="h-36 rounded-2xl bg-white/[0.06]" /></aside>
        </div>
      </div>
      <span className="sr-only">Sayfa yükleniyor</span>
    </main>
  );
}
