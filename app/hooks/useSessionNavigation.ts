"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { accountLoginPath } from "@/lib/navigation";
import { clearAccountSessionCache } from "@/lib/clientAccountSession";

export function useSessionNavigation() {
  const router = useRouter();

  const goToLogin = useCallback(
    (next: string) => {
      router.push(accountLoginPath(next));
    },
    [router]
  );

  const logoutToHome = useCallback(async () => {
    const response = await fetch("/api/accounts/logout", { method: "POST" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || "Çıkış işlemi tamamlanamadı.");
    }
    clearAccountSessionCache();
    router.replace("/");
    router.refresh();
  }, [router]);

  return { goToLogin, logoutToHome };
}
