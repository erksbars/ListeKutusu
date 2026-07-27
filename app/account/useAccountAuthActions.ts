"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import { safeInternalPath } from "@/lib/navigation";

type UseAccountAuthActionsOptions = {
  loading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setMessage: Dispatch<SetStateAction<string | null>>;
};

function returnPathAfterAuth() {
  const next = new URLSearchParams(window.location.search).get("next");
  return safeInternalPath(next);
}

export function useAccountAuthActions({ loading, setLoading, setMessage }: UseAccountAuthActionsOptions) {
  const router = useRouter();
  const [ownerName, setOwnerName] = useState("");
  const [playlistName, setPlaylistName] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");

  async function createAccount() {
    if (loading) return;
    const name = ownerName.trim();
    if (!name) return setMessage("Hesap adı gerekli.");
    if (!playlistName.trim()) return setMessage("Liste adı gerekli.");
    if (!registerEmail.trim()) return setMessage("E-posta gerekli.");
    if (registerPassword.length < 8) return setMessage("Şifre en az 8 karakter olmalı.");
    if (registerPassword !== registerPasswordConfirm) return setMessage("Şifreler birbiriyle eşleşmiyor.");

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerName: name,
          playlistName,
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.list) {
        setMessage(data.error || "Hesap açılamadı.");
        return;
      }
      setRegisterPassword("");
      setRegisterPasswordConfirm("");
      router.replace(returnPathAfterAuth());
      router.refresh();
    } catch {
      setMessage("Bağlantı kurulamadı. Hesap oluşturmayı tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    if (loading) return;
    const email = loginEmail.trim();
    if (!email || !loginPassword) {
      setMessage("E-posta ve şifre gir.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/accounts/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: loginPassword, remember: rememberMe }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.list) {
        setMessage(data.error || "Giriş başarısız.");
        return;
      }
      router.replace(returnPathAfterAuth());
      router.refresh();
    } catch {
      setMessage("Bağlantı kurulamadı. Giriş yapmayı tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  return {
    ownerName,
    playlistName,
    loginEmail,
    loginPassword,
    rememberMe,
    registerEmail,
    registerPassword,
    registerPasswordConfirm,
    setOwnerName,
    setPlaylistName,
    setLoginEmail,
    setLoginPassword,
    setRememberMe,
    setRegisterEmail,
    setRegisterPassword,
    setRegisterPasswordConfirm,
    createAccount,
    login,
  };
}
