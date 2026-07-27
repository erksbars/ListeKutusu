"use client";

import { useState } from "react";
import { Download, Eye, EyeOff, KeyRound, Trash2, UserRound } from "lucide-react";
import { ActiveSessionsPanel } from "./ActiveSessionsPanel";
import { BlockedAccountsPanel } from "./BlockedAccountsPanel";
import { Button, TextField, buttonClassName } from "./ui";

type AccountSettingsPanelProps = {
  view: "security" | "privacy" | "data";
  ownerName: string;
  email: string | null;
  currentPassword: string;
  newPassword: string;
  deletePassword: string;
  deleteConfirmation: string;
  loading: boolean;
  deletingAccount: boolean;
  onCurrentPasswordChange: (value: string) => void;
  onNewPasswordChange: (value: string) => void;
  onDeletePasswordChange: (value: string) => void;
  onDeleteConfirmationChange: (value: string) => void;
  onChangePassword: () => void;
  onDeleteAccount: () => void;
};

export function AccountSettingsPanel({
  view,
  ownerName,
  email,
  currentPassword,
  newPassword,
  deletePassword,
  deleteConfirmation,
  loading,
  deletingAccount,
  onCurrentPasswordChange,
  onNewPasswordChange,
  onDeletePasswordChange,
  onDeleteConfirmationChange,
  onChangePassword,
  onDeleteAccount,
}: AccountSettingsPanelProps) {
  const deleteReady = Boolean(deletePassword) && deleteConfirmation === "HESABIMI SİL";
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const visibilityAction = (visible: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="ui-field-action"
      aria-label={visible ? "Şifreyi gizle" : "Şifreyi göster"}
      title={visible ? "Şifreyi gizle" : "Şifreyi göster"}
    >
      {visible ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {view === "security" && (
        <>
          <section className="account-content-panel">
            <h2 className="section-kicker flex items-center gap-2">
              <UserRound size={16} /> Hesap bilgileri
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Oturum açtığın hesabın temel bilgileri.
            </p>
            <dl className="mt-5 grid gap-3 text-sm">
              <div className="track-card rounded-xl p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">Kullanıcı adı</dt>
                <dd className="mt-1 break-words font-semibold text-navy">{ownerName}</dd>
              </div>
              <div className="track-card rounded-xl p-4">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">E-posta</dt>
                <dd className="mt-1 break-all font-semibold text-navy">{email || "Belirtilmemiş"}</dd>
              </div>
            </dl>
          </section>

          <form
            className="account-content-panel"
            onSubmit={(event) => {
              event.preventDefault();
              onChangePassword();
            }}
          >
            <h2 className="section-kicker flex items-center gap-2">
              <KeyRound size={16} /> Şifre değiştir
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              En az 8 karakterli yeni bir şifre belirle. Değişiklikten sonra tüm cihazlardaki oturumların kapatılır.
            </p>
            <TextField
              fieldClassName="mt-4"
              label="Mevcut şifre"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Mevcut şifren"
              autoComplete="current-password"
              maxLength={128}
              required
              value={currentPassword}
              onChange={(event) => onCurrentPasswordChange(event.target.value)}
              trailingAction={visibilityAction(showCurrentPassword, () => setShowCurrentPassword((show) => !show))}
            />
            <TextField
              fieldClassName="mt-4"
              label="Yeni şifre"
              type={showNewPassword ? "text" : "password"}
              placeholder="En az 8 karakter"
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              value={newPassword}
              hint="Şifren en az 8 karakter olmalı."
              onChange={(event) => onNewPasswordChange(event.target.value)}
              trailingAction={visibilityAction(showNewPassword, () => setShowNewPassword((show) => !show))}
            />
            <Button
              type="submit"
              variant="primary"
              className="mt-5 w-full"
              loading={loading}
              disabled={!currentPassword || newPassword.length < 8}
            >
              Şifreyi güncelle
            </Button>
          </form>

          <ActiveSessionsPanel />
        </>
      )}

      {view === "data" && (
        <>
          <section className="account-content-panel lg:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-2xl">
                <h2 className="section-kicker">Verilerim</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Profilini, kişisel listeni, önerilerini, paylaşımlarını ve sosyal etkileşimlerini JSON dosyası olarak indir. Şifren ve dahili güvenlik bilgileri dosyaya eklenmez.
                </p>
              </div>
              <a
                href="/api/accounts/export"
                download
                className={buttonClassName({ size: "md", className: "shrink-0" })}
              >
                <Download size={16} /> Verilerimi indir
              </a>
            </div>
          </section>

          <section className="account-danger-zone lg:col-span-2">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-end">
              <div>
                <p className="section-kicker account-danger-kicker">Tehlikeli alan</p>
                <h2 className="mt-2 text-xl font-black">Hesabı kalıcı olarak sil</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6">
                  Profilin, paylaşımların, önerilerin ve sosyal etkileşimlerin silinir. Bu işlem geri alınamaz. Önce Verilerim bölümünden bir kopya indirebilirsin.
                </p>
              </div>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (deleteReady) onDeleteAccount();
                }}
              >
                <TextField
                  label="Mevcut şifre"
                  type="password"
                  value={deletePassword}
                  onChange={(event) => onDeletePasswordChange(event.target.value)}
                  placeholder="Mevcut şifre"
                  autoComplete="current-password"
                  maxLength={128}
                  required
                />
                <TextField
                  fieldClassName="mt-4"
                  label="Onay metni"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(event) => onDeleteConfirmationChange(event.target.value)}
                  placeholder="HESABIMI SİL yaz"
                  autoComplete="off"
                  hint="Devam etmek için HESABIMI SİL yaz."
                  required
                />
                <Button
                  type="submit"
                  variant="danger"
                  className="mt-4 w-full"
                  loading={deletingAccount}
                  disabled={!deleteReady}
                  leadingIcon={<Trash2 size={16} />}
                >
                  Hesabımı sil
                </Button>
              </form>
            </div>
          </section>
        </>
      )}

      {view === "privacy" && <BlockedAccountsPanel />}
    </div>
  );
}
