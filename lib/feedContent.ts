export const FEED_NOTE_MAX_LENGTH = 400;

export type FeedNoteResult =
  | { ok: true; note: string | null }
  | { ok: false; error: string };

export function normalizeFeedNote(value: unknown): FeedNoteResult {
  if (value === undefined || value === null || value === "") {
    return { ok: true, note: null };
  }
  if (typeof value !== "string") {
    return { ok: false, error: "Paylaşım açıklaması geçersiz." };
  }

  const note = value.replace(/\r\n?/g, "\n").trim();
  if (!note) return { ok: true, note: null };
  if (note.length > FEED_NOTE_MAX_LENGTH) {
    return {
      ok: false,
      error: `Paylaşım açıklaması en fazla ${FEED_NOTE_MAX_LENGTH} karakter olabilir.`,
    };
  }

  return { ok: true, note };
}
