import type { TrackResult } from "./spotify";

export function selectRandomTracks(
  tracks: TrackResult[],
  count = 5,
  excludedIds: Iterable<string> = []
) {
  const excluded = new Set(excludedIds);
  const unique = new Map<string, TrackResult>();

  for (const track of tracks) {
    if (track.id && !excluded.has(track.id) && !unique.has(track.id)) {
      unique.set(track.id, track);
    }
  }

  const pool = [...unique.values()];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, Math.max(0, count));
}
