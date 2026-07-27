type SpotifyAttributionProps = {
  tone?: "light" | "dark";
};

export function SpotifyAttribution({ tone = "light" }: SpotifyAttributionProps) {
  const dark = tone === "dark";

  return (
    <a
      href="https://open.spotify.com"
      target="_blank"
      rel="noreferrer"
      aria-label="Spotify'ı aç"
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold transition ${
        dark
          ? "bg-white/10 text-white hover:bg-white/15"
          : "border border-sky-200 bg-white/78 text-slate-700 hover:bg-white"
      }`}
    >
      <span
        aria-hidden="true"
        className="spotify-brand-mark flex h-[21px] w-[21px] items-center justify-center rounded-full"
      >
        <svg viewBox="0 0 24 24" className="h-[14px] w-[14px] fill-black">
          <path d="M12 1.8A10.2 10.2 0 1 0 12 22.2 10.2 10.2 0 0 0 12 1.8Zm4.68 14.7a.73.73 0 0 1-1 .24c-2.76-1.68-6.24-2.06-10.34-1.13a.73.73 0 1 1-.32-1.42c4.48-1.02 8.34-.58 11.42 1.3.34.2.45.65.24 1.01Zm1.25-2.8a.9.9 0 0 1-1.24.3c-3.16-1.94-7.98-2.5-11.72-1.37a.9.9 0 0 1-.52-1.72c4.26-1.3 9.56-.67 13.18 1.55.43.26.56.82.3 1.24Zm.1-2.92c-3.79-2.25-10.04-2.46-13.66-1.36a1.08 1.08 0 1 1-.63-2.07c4.16-1.26 11.06-1.01 15.4 1.57a1.08 1.08 0 1 1-1.1 1.86Z" />
        </svg>
      </span>
      <span>Spotify</span>
    </a>
  );
}
