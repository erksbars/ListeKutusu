const TRACK_ID_PATTERN = /^[A-Za-z0-9]{22}$/;
const TRACK_REFERENCE_PATTERN =
  /(?:open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/|spotify:track:)([A-Za-z0-9]{22})/gi;

export const MAX_TRACK_IMPORT_SIZE = 500;
export const TRACK_IMPORT_BATCH_SIZE = 20;

export type ParsedTrackImport = {
  ids: string[];
  totalReferences: number;
  duplicateCount: number;
  invalidLineCount: number;
  truncatedCount: number;
};

export function isSpotifyTrackId(value: string) {
  return TRACK_ID_PATTERN.test(value);
}

export function parseSpotifyTrackReferences(
  input: string,
  limit = MAX_TRACK_IMPORT_SIZE
): ParsedTrackImport {
  const found: string[] = [];
  let invalidLineCount = 0;

  for (const line of input.split(/\r?\n/)) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    const lineIds: string[] = [];
    TRACK_REFERENCE_PATTERN.lastIndex = 0;
    for (const match of cleanLine.matchAll(TRACK_REFERENCE_PATTERN)) {
      if (match[1]) lineIds.push(match[1]);
    }

    if (lineIds.length === 0 && isSpotifyTrackId(cleanLine)) {
      lineIds.push(cleanLine);
    }

    if (lineIds.length === 0) invalidLineCount += 1;
    found.push(...lineIds);
  }

  const uniqueIds = [...new Set(found)];
  return {
    ids: uniqueIds.slice(0, Math.max(0, limit)),
    totalReferences: found.length,
    duplicateCount: found.length - uniqueIds.length,
    invalidLineCount,
    truncatedCount: Math.max(0, uniqueIds.length - limit),
  };
}
