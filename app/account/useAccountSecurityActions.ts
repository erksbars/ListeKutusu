"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { clearAccountSessionCache } from "@/lib/clientAccountSession";

type UseAccountSecurityActionsOptions = {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
  onUnauthorized: () => void;
  onSignedOut: (message: string) => void;
};

export function useAccountSecurityActions({
  loading,
  setLoading,
  setMessage,
  onUnauthorized,
  onSignedOut,
}: UseAccountSecurityActionsOptions) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  async function logout() {
    if (loading) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/accounts/logout", { method: "POST" });
      if (!response.ok) throw new Error("Çıkış işlemi tamamlanamadı.");
      clearAccountSessionCache();
      onSignedOut("Çıkış yapıldı.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Çıkış işlemi tamamlanamadı. Tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    if (loading) return;
    if (!currentPassword || !newPassword) {
      setMessage("Mevcut şifre ve yeni şifre gerekli.");
      return;
    }
    if (newPassword.length < 8) {
      setMessage("Yeni şifre en az 8 karakter olmalı.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/accounts/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "change-password", currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        onUnauthorized();
        return;
      }
      if (!response.ok) throw new Error(data.error || "Şifre değiştirilemedi.");
      setCurrentPassword("");
      setNewPassword("");
      clearAccountSessionCache();
      onSignedOut("Şifre güncellendi. Güvenliğin için tüm cihazlardaki oturumlar kapatıldı; yeniden giriş yap.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Şifre değiştirilemedi. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteAccount() {
    if (deletingAccount) return;
    if (!deletePassword || deleteConfirmation !== "HESABIMI SİL") {
      setMessage("Şifreni ve silme onay metnini eksiksiz gir.");
      return;
    }

    setDeletingAccount(true);
    setMessage(null);
    try {
      const response = await fetch("/api/accounts/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmation }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error || "Hesap silinemedi.");
        return;
      }
      clearAccountSessionCache();
      router.replace("/");
      router.refresh();
    } catch {
      setMessage("Bağlantı kurulamadı. Hesap silme işlemini tekrar dene.");
    } finally {
      setDeletingAccount(false);
    }
  }

  return {
    currentPassword,
    newPassword,
    deletePassword,
    deleteConfirmation,
    deletingAccount,
    setCurrentPassword,
    setNewPassword,
    setDeletePassword,
    setDeleteConfirmation,
    logout,
    changePassword,
    deleteAccount,
  };
}
