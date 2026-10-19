"use client";

import { useEffect } from "react";
import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";

type ToastTone = "info" | "success" | "error";

type ToastProps = {
  message: string | null;
  tone?: ToastTone;
  onClose?: () => void;
};

function inferTone(message: string | null, fallback: ToastTone): ToastTone {
  if (!message) return fallback;
  const text = message.toLocaleLowerCase("tr-TR");
  if (
    text.includes("403") ||
    text.includes("forbidden") ||
    text.includes("reddedildi") ||
    text.includes("başarısız") ||
    text.includes("hata") ||
    text.includes("geçersiz") ||
    text.includes("bulunamadı") ||
    text.includes("olamaz") ||
    text.includes("açılamadı") ||
    text.includes("kaydedilemedi") ||
    text.includes("yenilenemedi") ||
    text.includes("tamamlanamadı") ||
    text.includes("başlatılamadı") ||
    text.includes("değiştirilemedi") ||
    text.includes("kaldırılamadı") ||
    text.includes("eklenemedi")
  ) {
    return "error";
  }
  if (
    text.includes("güncellendi") ||
    text.includes("yenilendi") ||
    text.includes("kaydedildi") ||
    text.includes("onaylandı") ||
    text.includes("gönderildi") ||
    text.includes("kopyalandı") ||
    text.includes("açıldı") ||
    text.includes("eklendi") ||
    text.includes("paylaşıldı") ||
    text.includes("takip edildi")
  ) {
    return "success";
  }
  return fallback;
}

export function Toast({ message, tone, onClose }: ToastProps) {
  useEffect(() => {
    if (!message || !onClose) return;
    const nextTone = tone ?? inferTone(message, "info");
    const timeout = window.setTimeout(
      onClose,
      nextTone === "error" ? 7000 : 4200
    );
    return () => window.clearTimeout(timeout);
  }, [message, onClose, tone]);

  if (!message) return null;

  const nextTone = tone ?? inferTone(message, "info");
  const label =
    nextTone === "success" ? "Tamam" : nextTone === "error" ? "Dikkat" : "Bilgi";
  const Icon = nextTone === "success" ? CircleCheck : nextTone === "error" ? TriangleAlert : Info;

  return (
    <div
      className="toast-stack"
      role={nextTone === "error" ? "alert" : "status"}
      aria-live={nextTone === "error" ? "assertive" : "polite"}
    >
      <div className={`toast-card toast-card-${nextTone}`}>
        <span className="toast-symbol" aria-hidden="true"><Icon size={17} /></span>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-100/72">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold leading-5 text-white">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="toast-close"
            aria-label="Uyarıyı kapat"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
