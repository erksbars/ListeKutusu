"use client";

import { ChevronDown, Copy, ExternalLink, Link2, ListMusic, RefreshCw, Save, Send } from "lucide-react";
import { SpotifyAttribution } from "./SpotifyAttribution";
import { BulkTrackImport } from "./BulkTrackImport";

type AccountListPanelProps = {
  spotifyPlaylistId: string | null;
  spotifyExternalUrl: string | null;
  submitCode: string | null;
  copyServiceUrl: string;
  rejectedCount: number;
  playlistName: string;
  playlistDirty: boolean;
  friendCode: string;
  loading: boolean;
  onPlaylistNameChange: (value: string) => void;
  onFriendCodeChange: (value: string) => void;
  onExportList: () => void;
  onSavePlaylistName: () => void;
  onCopyInviteLink: () => void;
  onRotateInviteCode: () => void;
  onOpenFriendInvite: () => void;
  onImportComplete: (message: string) => void | Promise<void>;
};

export function AccountListPanel({
  spotifyPlaylistId,
  spotifyExternalUrl,
  submitCode,
  copyServiceUrl,
  rejectedCount,
  playlistName,
  playlistDirty,
  friendCode,
  loading,
  onPlaylistNameChange,
  onFriendCodeChange,
  onExportList,
  onSavePlaylistName,
  onCopyInviteLink,
  onRotateInviteCode,
  onOpenFriendInvite,
  onImportComplete,
}: AccountListPanelProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
      <section className="account-content-panel account-content-panel-dark">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-100/80">
            Spotify listesi
          </h2>
          <SpotifyAttribution tone="dark" />
        </div>
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/12 bg-white/8 p-3">
          <span
            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
              spotifyPlaylistId ? "bg-emerald-400" : "bg-amber-300"
            }`}
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-black text-white">
              {spotifyPlaylistId ? "Spotify listesi hazır" : "İlk senkron bekleniyor"}
            </p>
            <p className="mt-1 text-xs leading-5 text-sky-100/68">
              {spotifyPlaylistId
                ? "Onaylı şarkıların uygulamadaki listenle eşitlenebilir."
                : "Şarkıların önce uygulamada saklanır. Hazır olduğunda Spotify listesini oluşturabilirsin."}
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-sky-100/80">
          Onaylanan şarkılar uygulamadaki listende kalıcı tutulur ve Spotify hesabındaki listeyle senkronlanır.
          {rejectedCount > 0 ? ` ${rejectedCount} şarkı reddedildi.` : ""}
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onExportList}
            disabled={loading}
            className="primary-action h-11 rounded-xl px-3 text-sm font-black disabled:cursor-wait disabled:bg-slate-300 sm:col-span-2"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            <span>{loading
              ? "Senkronlanıyor..."
              : spotifyPlaylistId
                ? "Spotify ile senkronla"
                : "Spotify listesi oluştur"}</span>
          </button>
          {spotifyExternalUrl && (
            <>
              <a
                href={spotifyExternalUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-center rounded-xl border border-white/24 bg-white/10 px-3 text-center text-sm font-bold text-white hover:border-cyan-200/60 hover:bg-white/16"
              >
                <ExternalLink size={15} /> <span>Spotify'da aç</span>
              </a>
              <a
                href={copyServiceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center justify-center rounded-xl border border-white/24 bg-white/10 px-3 text-center text-sm font-bold text-white hover:border-cyan-200/60 hover:bg-white/16"
              >
                <ListMusic size={15} /> <span>Kopyalama servisi</span>
              </a>
            </>
          )}
        </div>
      </section>

      <form
        className="account-content-panel"
        onSubmit={(event) => {
          event.preventDefault();
          onSavePlaylistName();
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="section-kicker">Liste ayarları</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Uygulamada ve yeni Spotify eşitlemelerinde kullanılan liste adını değiştir.</p>
          </div>
          {playlistDirty && <span className="unsaved-badge">Kaydedilmedi</span>}
        </div>
        <label htmlFor="playlist-name" className="form-label mt-4">Liste adı</label>
        <input
          id="playlist-name"
          type="text"
          value={playlistName}
          onChange={(event) => onPlaylistNameChange(event.target.value)}
          maxLength={80}
          required
          className="ghost-input mt-2 h-11 w-full rounded-xl px-4 text-sm outline-none transition"
        />
        <p className="mt-2 text-right text-xs font-medium text-slate-400">{playlistName.length}/80</p>
        <button
          type="submit"
          disabled={loading || !playlistDirty || playlistName.trim().length === 0}
          className="primary-action mt-3 h-11 w-full rounded-xl px-4 text-sm font-black disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <Save size={16} /> <span>Liste adını kaydet</span>
        </button>
      </form>

      <BulkTrackImport onImported={onImportComplete} />

      <details className="account-content-panel account-disclosure lg:col-span-2">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-navy">
          <span className="flex items-center gap-2"><Link2 size={17} /> Arkadaş önerileri</span>
          <ChevronDown size={17} className="account-disclosure-chevron text-slate-500" aria-hidden="true" />
        </summary>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Bağlantıyı paylaştığın üyeler listene şarkı önerebilir. Öneriler önce İstekler bölümüne gelir;
          sen onaylamadan listene eklenmez.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="account-subpanel">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Senin davet kodun</p>
            <p className="mt-2 break-all font-mono text-sm font-bold text-navy">
              {submitCode || "Kod oluşturulamadı"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onCopyInviteLink}
                disabled={!submitCode}
                className="primary-action h-10 rounded-xl px-4 text-xs font-black disabled:opacity-50"
              >
                <Copy size={15} /> <span>Bağlantıyı kopyala</span>
              </button>
              <button
                type="button"
                onClick={onRotateInviteCode}
                disabled={loading}
                className="secondary-action h-10 rounded-xl px-4 text-xs font-bold disabled:opacity-50"
              >
                <RefreshCw size={15} /> <span>Kodu yenile</span>
              </button>
            </div>
          </div>
          <form
            className="account-subpanel"
            onSubmit={(event) => {
              event.preventDefault();
              onOpenFriendInvite();
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.14em] text-sky-700">Bir arkadaşına öner</p>
            <label htmlFor="friend-invite-code" className="form-label mt-3">Arkadaşının davet kodu</label>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                id="friend-invite-code"
                value={friendCode}
                onChange={(event) => onFriendCodeChange(event.target.value.toUpperCase())}
                placeholder="EKLE-XXXXXXXX"
                className="ghost-input h-10 min-w-0 flex-1 rounded-xl px-3 font-mono text-sm outline-none"
              />
              <button type="submit" className="secondary-action h-10 rounded-xl px-4 text-xs font-black">
                <Send size={15} /> <span>Listeyi aç</span>
              </button>
            </div>
          </form>
        </div>
      </details>
    </div>
  );
}
