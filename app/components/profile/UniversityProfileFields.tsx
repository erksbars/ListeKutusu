"use client";
import { parseUniversityUpdate, type UniversityDraft } from "@/lib/profileUniversity";
import { TextField } from "../ui/Field";
import { Checkbox } from "../ui/Checkbox";

export function UniversityProfileFields({ value, onChange }: { value: UniversityDraft; onChange: (value: UniversityDraft) => void }) {
  const result = parseUniversityUpdate(value);
  return <section className="grid gap-3" aria-label="Üniversite ayarları">
    <TextField label="Üniversite (isteğe bağlı)" value={value.name} maxLength={120} labelMeta={`${value.name.length}/120`}
      onChange={event => onChange({ name: event.target.value, public: Boolean(event.target.value.trim() && value.public) })}
      error={result.ok ? undefined : result.error} hint="Kurumun adını elle yazabilirsin. Üniversite bilgisi eklemek zorunlu değildir." />
    <Checkbox label="Üniversitemi herkese açık profilimde göster" checked={value.public} disabled={!value.name.trim()}
      onChange={event => onChange({ ...value, public: event.target.checked })}
      description="Kapalıyken üniversite adı yalnız hesap ayarlarında kalır. Açarsan profilini ziyaret eden herkes görebilir." />
    <p className="profile-editor-help">Bu bilgi kullanıcı beyanıdır; öğrencilik veya kurum bağlantısı doğrulanmaz. Üniversite eklemek profil tamamlanma puanını etkilemez.</p>
  </section>;
}
