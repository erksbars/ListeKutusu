export type UniversityDraft = { name: string; public: boolean };
type UniversityFields = { universityName?: string | null; universityPublic?: boolean };
export type UniversityUpdate = { universityName: string | null; universityPublic: boolean };

export function universityDraft(value?: UniversityFields | null): UniversityDraft {
  return { name: value?.universityName ?? "", public: value?.universityPublic === true };
}

export function changedUniversity(draft: UniversityDraft | undefined, saved?: UniversityFields | null) {
  const current = universityDraft(saved);
  return draft && (draft.name !== current.name || draft.public !== current.public) ? draft : undefined;
}

export function parseUniversityUpdate(value: unknown): { ok: true; data: UniversityUpdate | undefined } | { ok: false; error: string } {
  // Omission preserves data for older clients and unrelated profile saves.
  if (value === undefined) return { ok: true, data: undefined };
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Geçerli üniversite bilgisi gerekli." };
  const fields = value as Record<string, unknown>;
  if (typeof fields.name !== "string" || typeof fields.public !== "boolean") return { ok: false, error: "Üniversite adı ve görünürlük tercihini kontrol et." };
  // Unicode control characters are rejected before whitespace normalization.
  if (/\p{Cc}/u.test(fields.name)) return { ok: false, error: "Üniversite adı tek satır olmalı ve kontrol karakteri içermemeli." };
  const name = fields.name.normalize("NFC").trim().replace(/\s+/gu, " ");
  if (name && (name.length < 2 || name.length > 120)) return { ok: false, error: "Üniversite adı 2–120 karakter olmalı veya boş bırakılmalı." };
  return { ok: true, data: { universityName: name || null, universityPublic: Boolean(name && fields.public) } };
}

export function publicUniversity(value: UniversityFields, interactionBlocked = false) {
  return !interactionBlocked && value.universityPublic === true ? value.universityName ?? null : null;
}
