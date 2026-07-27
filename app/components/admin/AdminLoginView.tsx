"use client";

import { Eye, EyeOff, KeyRound, ListMusic, Music2, ShieldCheck, TriangleAlert, UsersRound } from "lucide-react";
import { PageTopbar } from "../PageTopbar";
import { Toast } from "../Toast";
import { Button, TextField } from "../ui";

type AdminLoginViewProps = {
  loginKey: string;
  showLoginKey: boolean;
  loginError: string | null;
  pageError: string | null;
  busy: boolean;
  onLoginKeyChange: (value: string) => void;
  onToggleVisibility: () => void;
  onClearPageError: () => void;
  onLogin: () => void;
};

export function AdminLoginView({
  loginKey,
  showLoginKey,
  loginError,
  pageError,
  busy,
  onLoginKeyChange,
  onToggleVisibility,
  onClearPageError,
  onLogin,
}: AdminLoginViewProps) {
  return (
    <main id="main-content" tabIndex={-1} className="stage-shell min-h-screen bg-app px-4 pb-12 sm:px-6">
      <Toast message={pageError} onClose={onClearPageError} />
      <div className="ui-page-frame relative mx-auto">
        <PageTopbar
          title="Sistem yönetimi"
          subtitle="Yetkili erişimi"
          icon={<ShieldCheck size={18} />}
          backLabel="Ana sayfaya dön"
        />
        <section className="admin-login-layout">
          <div className="admin-login-copy">
            <span className="brand-mark"><Music2 size={18} /></span>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-cyan-100/72">ListeKutusu yönetimi</p>
            <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">Topluluğu tek merkezden yönet.</h1>
            <p className="admin-login-description">
              Spotify bağlantısını, kullanıcı listelerini, bekleyen kararları ve topluluk bildirimlerini güvenli panelden takip et.
            </p>
            <div className="mt-6 grid gap-2">
              <span className="admin-login-feature"><ListMusic size={17} /> Liste ve senkron durumu</span>
              <span className="admin-login-feature"><TriangleAlert size={17} /> Moderasyon kuyruğu</span>
              <span className="admin-login-feature"><UsersRound size={17} /> Kullanıcı hareketleri</span>
            </div>
          </div>
          <form
            className="account-auth-card rounded-2xl p-6 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              onLogin();
            }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-cyan-300"><KeyRound size={19} /></span>
            <p className="mt-5 section-kicker">Güvenli oturum</p>
            <h2 className="mt-2 text-2xl font-black text-navy">Yönetici girişi</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Yerel yönetici anahtarını kullanarak devam et.</p>
            <TextField
              fieldClassName="mt-5"
              label="Yönetici anahtarı"
              type={showLoginKey ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Yerel yönetici anahtarını yaz"
              value={loginKey}
              error={loginError || undefined}
              hint="Anahtar yalnızca bu yönetim oturumunu başlatmak için kullanılır."
              onChange={(event) => onLoginKeyChange(event.target.value)}
              trailingAction={(
                <button
                  type="button"
                  onClick={onToggleVisibility}
                  aria-label={showLoginKey ? "Anahtarı gizle" : "Anahtarı göster"}
                  title={showLoginKey ? "Anahtarı gizle" : "Anahtarı göster"}
                  className="ui-field-action"
                >
                  {showLoginKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              )}
            />
            <Button type="submit" className="mt-5 w-full" size="lg" loading={busy} disabled={!loginKey.trim()}>
              Yönetim paneline gir
            </Button>
          </form>
        </section>
      </div>
    </main>
  );
}
