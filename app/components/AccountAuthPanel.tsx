"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, ListChecks, Sparkles, UsersRound } from "lucide-react";
import { Button, Checkbox, TextField } from "./ui";

type AuthMode = "login" | "create";

type AccountAuthPanelProps = {
  mode: AuthMode;
  loading: boolean;
  loginEmail: string;
  loginPassword: string;
  rememberMe: boolean;
  ownerName: string;
  playlistName: string;
  registerEmail: string;
  registerPassword: string;
  registerPasswordConfirm: string;
  onModeChange: (mode: AuthMode) => void;
  onLoginEmailChange: (value: string) => void;
  onLoginPasswordChange: (value: string) => void;
  onRememberMeChange: (value: boolean) => void;
  onOwnerNameChange: (value: string) => void;
  onPlaylistNameChange: (value: string) => void;
  onRegisterEmailChange: (value: string) => void;
  onRegisterPasswordChange: (value: string) => void;
  onRegisterPasswordConfirmChange: (value: string) => void;
  onLogin: () => void;
  onCreateAccount: () => void;
};

export function AccountAuthPanel({
  mode,
  loading,
  loginEmail,
  loginPassword,
  rememberMe,
  ownerName,
  playlistName,
  registerEmail,
  registerPassword,
  registerPasswordConfirm,
  onModeChange,
  onLoginEmailChange,
  onLoginPasswordChange,
  onRememberMeChange,
  onOwnerNameChange,
  onPlaylistNameChange,
  onRegisterEmailChange,
  onRegisterPasswordChange,
  onRegisterPasswordConfirmChange,
  onLogin,
  onCreateAccount,
}: AccountAuthPanelProps) {
  const passwordsMatch = registerPassword === registerPasswordConfirm;
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  function changeMode(nextMode: AuthMode) {
    onModeChange(nextMode);
    const url = new URL(window.location.href);
    url.searchParams.set("mode", nextMode);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
  }

  return (
    <div className="auth-layout mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(420px,1fr)]">
      <aside className="auth-intro hidden pt-10 text-white lg:block">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-cyan-200/78">
          Tek hesap, bütün deneyim
        </p>
        <h2 className="mt-3 max-w-md text-3xl font-black leading-tight">
          Müziğini paylaşmak için yerini ayır.
        </h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-cyan-50/74">
          Profilini oluştur, topluluğun keşiflerine katıl ve kişisel listeni tek panelden yönet.
        </p>
        <div className="mt-8 grid gap-3">
          <div className="auth-benefit">
            <Sparkles size={18} aria-hidden="true" />
            <span>Şarkı keşiflerini akışta paylaş</span>
          </div>
          <div className="auth-benefit">
            <ListChecks size={18} aria-hidden="true" />
            <span>Kişisel listeni düzenle ve senkronla</span>
          </div>
          <div className="auth-benefit">
            <UsersRound size={18} aria-hidden="true" />
            <span>Profilleri takip et, puanını büyüt</span>
          </div>
        </div>
      </aside>
      <div>
      <section className="max-w-none">
        <div
          className="auth-tabs mb-3 grid grid-cols-2 rounded-xl p-1"
          aria-label="Hesap işlemi"
        >
          {(["login", "create"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => changeMode(item)}
              aria-pressed={mode === item}
              className="auth-tab"
            >
              {item === "login" ? "Giriş yap" : "Kayıt ol"}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <form
            className="account-auth-card rounded-2xl p-6 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              onLogin();
            }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
              Tek hesap
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Hesabına dön</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Akışını, profilini, puanını ve kişisel listeni kaldığın yerden yönet.
            </p>
            <TextField
              fieldClassName="mt-5"
              label="E-posta"
              type="email"
              placeholder="ornek@eposta.com"
              autoComplete="email"
              maxLength={254}
              required
              value={loginEmail}
              onChange={(event) => onLoginEmailChange(event.target.value)}
            />
            <TextField
              fieldClassName="mt-4"
              label="Şifre"
              type={showLoginPassword ? "text" : "password"}
              placeholder="Şifreni yaz"
              autoComplete="current-password"
              maxLength={128}
              required
              value={loginPassword}
              onChange={(event) => onLoginPasswordChange(event.target.value)}
              trailingAction={
                <button
                  type="button"
                  onClick={() => setShowLoginPassword((current) => !current)}
                  className="ui-field-action"
                  aria-label={showLoginPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  title={showLoginPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <Checkbox
              label="Beni hatırla"
              checked={rememberMe}
              onChange={(event) => onRememberMeChange(event.target.checked)}
              containerClassName="mt-3"
            />
            <Button
              type="submit"
              loading={loading}
              variant="primary"
              size="lg"
              className="mt-2 w-full"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş yap"}
            </Button>
          </form>
        ) : (
          <form
            className="account-auth-card rounded-2xl p-6 sm:p-7"
            onSubmit={(event) => {
              event.preventDefault();
              onCreateAccount();
            }}
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">
              Yeni profil
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">Aramıza katıl</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Profilini oluştur; keşiflerini paylaş, listeni büyüt ve aylık sıralamada yerini al.
            </p>
            <TextField
              fieldClassName="mt-5"
              label="Kullanıcı adı"
              hint="2-40 karakter; profilinde ve paylaşımlarında görünür."
              type="text"
              placeholder="Toplulukta görünecek adın"
              autoComplete="nickname"
              minLength={2}
              maxLength={40}
              required
              value={ownerName}
              onChange={(event) => onOwnerNameChange(event.target.value)}
            />
            <TextField
              fieldClassName="mt-4"
              label="Kişisel liste adı"
              hint={`${playlistName.length}/80 karakter`}
              type="text"
              placeholder="Örn. Gece yolculuğu"
              autoComplete="off"
              maxLength={80}
              required
              value={playlistName}
              onChange={(event) => onPlaylistNameChange(event.target.value)}
            />
            <TextField
              fieldClassName="mt-4"
              label="E-posta"
              type="email"
              placeholder="ornek@eposta.com"
              autoComplete="email"
              maxLength={254}
              required
              value={registerEmail}
              onChange={(event) => onRegisterEmailChange(event.target.value)}
            />
            <TextField
              fieldClassName="mt-4"
              label="Şifre"
              hint="8-128 karakter"
              type={showRegisterPassword ? "text" : "password"}
              placeholder="En az 8 karakter"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={registerPassword}
              onChange={(event) => onRegisterPasswordChange(event.target.value)}
              trailingAction={
                <button
                  type="button"
                  onClick={() => setShowRegisterPassword((current) => !current)}
                  className="ui-field-action"
                  aria-label={showRegisterPassword ? "Şifreleri gizle" : "Şifreleri göster"}
                  title={showRegisterPassword ? "Şifreleri gizle" : "Şifreleri göster"}
                >
                  {showRegisterPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />
            <TextField
              fieldClassName="mt-4"
              label="Şifre tekrarı"
              hint={registerPasswordConfirm.length > 0 && passwordsMatch ? "Şifreler eşleşiyor" : undefined}
              error={registerPasswordConfirm.length > 0 && !passwordsMatch ? "Şifreler eşleşmiyor" : undefined}
              type={showRegisterPassword ? "text" : "password"}
              placeholder="Şifreyi tekrar yaz"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={registerPasswordConfirm}
              onChange={(event) => onRegisterPasswordConfirmChange(event.target.value)}
            />
            <Button
              type="submit"
              loading={loading}
              disabled={registerPassword.length < 8 || !passwordsMatch}
              variant="primary"
              size="lg"
              className="mt-4 w-full"
            >
              {loading ? "Hesap açılıyor..." : "Hesap aç"}
            </Button>
          </form>
        )}
      </section>
      <div className="account-auth-footnote mt-4 flex flex-wrap gap-3 px-1 text-xs">
        <Link
          href="/legal"
          className="inline-flex min-h-9 items-center font-semibold text-cyan-100 hover:text-white"
        >
          Kullanım ve gizlilik
        </Link>
        <span className="inline-flex min-h-9 items-center text-cyan-50/74">
          Spotify bağlantısı liste sahibinin onayıyla kullanılır.
        </span>
      </div>
      </div>
    </div>
  );
}
