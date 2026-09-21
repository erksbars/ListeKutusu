type RouteLoadingVariant = "social" | "discover" | "forum" | "games" | "profile" | "account";

type RouteLoadingProps = {
  label: string;
  variant: RouteLoadingVariant;
};

function Pulse({ className }: { className: string }) {
  return <span aria-hidden="true" className={`block bg-white/[0.07] ${className}`} />;
}

function LoadingTopbar() {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <Pulse className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="min-w-0 space-y-2">
          <Pulse className="h-3 w-32 rounded" />
          <Pulse className="h-2 w-24 rounded" />
        </div>
      </div>
      <div className="flex gap-2">
        <Pulse className="h-10 w-10 rounded-xl" />
        <Pulse className="h-10 w-28 rounded-xl" />
      </div>
    </header>
  );
}

function LoadingRows({ count = 4, height = "h-24" }: { count?: number; height?: string }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <Pulse key={index} className={`${height} rounded-xl`} />
      ))}
    </div>
  );
}

function SocialLoading() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_300px]">
      <aside className="hidden space-y-3 lg:block"><LoadingRows count={7} height="h-10" /></aside>
      <section className="space-y-4">
        <Pulse className="h-32 rounded-xl" />
        <LoadingRows count={3} height="h-44" />
      </section>
      <aside className="hidden space-y-4 lg:block">
        <Pulse className="h-52 rounded-xl" />
        <Pulse className="h-40 rounded-xl" />
      </aside>
    </div>
  );
}

function DiscoverLoading() {
  return (
    <div className="space-y-5 pt-6">
      <Pulse className="h-44 rounded-xl" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <section className="space-y-4">
          <Pulse className="h-12 rounded-xl" />
          <LoadingRows count={4} height="h-28" />
        </section>
        <aside className="hidden space-y-4 xl:block">
          <Pulse className="h-56 rounded-xl" />
          <Pulse className="h-36 rounded-xl" />
        </aside>
      </div>
    </div>
  );
}

function ForumLoading() {
  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)_280px]">
      <aside className="hidden space-y-3 lg:block"><LoadingRows count={8} height="h-9" /></aside>
      <section className="space-y-4">
        <Pulse className="h-24 rounded-xl" />
        <Pulse className="h-10 rounded-xl" />
        <LoadingRows count={6} height="h-20" />
      </section>
      <aside className="hidden space-y-4 lg:block">
        <Pulse className="h-44 rounded-xl" />
        <Pulse className="h-52 rounded-xl" />
      </aside>
    </div>
  );
}

function GamesLoading() {
  return (
    <div className="space-y-6 pt-6">
      <Pulse className="h-48 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Pulse key={index} className="h-64 rounded-xl" />
        ))}
      </div>
      <Pulse className="h-36 rounded-xl" />
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="space-y-5 pt-6">
      <section className="overflow-hidden rounded-xl border border-white/10">
        <Pulse className="h-44 rounded-none" />
        <div className="flex items-end gap-5 px-6 pb-6">
          <Pulse className="-mt-10 h-24 w-24 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-3 pt-5">
            <Pulse className="h-5 w-52 rounded" />
            <Pulse className="h-3 w-72 max-w-full rounded" />
          </div>
          <Pulse className="h-10 w-28 rounded-xl" />
        </div>
      </section>
      <Pulse className="h-12 rounded-xl" />
      <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <Pulse className="h-72 rounded-xl" />
        <LoadingRows count={3} height="h-36" />
      </div>
    </div>
  );
}

function AccountLoading() {
  return (
    <div className="grid gap-5 pt-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <Pulse className="h-28 rounded-xl" />
        <LoadingRows count={6} height="h-10" />
      </aside>
      <section className="space-y-4">
        <Pulse className="h-24 rounded-xl" />
        <Pulse className="h-80 rounded-xl" />
      </section>
    </div>
  );
}

const variantContent: Record<RouteLoadingVariant, () => React.ReactNode> = {
  social: SocialLoading,
  discover: DiscoverLoading,
  forum: ForumLoading,
  games: GamesLoading,
  profile: ProfileLoading,
  account: AccountLoading,
};

export function RouteLoading({ label, variant }: RouteLoadingProps) {
  const Content = variantContent[variant];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="stage-shell min-h-screen bg-app px-4 pb-12 text-white sm:px-6"
      aria-busy="true"
      aria-label={label}
    >
      <div className="loading-shell ui-page-frame mx-auto animate-pulse">
        <LoadingTopbar />
        <Content />
      </div>
      <span className="sr-only">{label}</span>
    </main>
  );
}
