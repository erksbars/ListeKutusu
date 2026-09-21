export type ProfileDiscoverySignals = {
  sharedGenres: string[];
  posts: number;
  followers: number;
};

function normalizeGenre(value: string) {
  return value.trim().toLocaleLowerCase("tr-TR");
}

export function findSharedProfileGenres(viewerGenres: string[], candidateGenres: string[]) {
  const viewerSet = new Set(viewerGenres.map(normalizeGenre).filter(Boolean));
  const seen = new Set<string>();
  return candidateGenres.filter((genre) => {
    const normalized = normalizeGenre(genre);
    if (!normalized || seen.has(normalized) || !viewerSet.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function describeProfileSuggestion({ sharedGenres, posts, followers }: ProfileDiscoverySignals) {
  if (sharedGenres.length > 0) return `${sharedGenres.slice(0, 2).join(" · ")} ortak zevkiniz`;
  if (posts >= 5) return "Toplulukta aktif paylaşımcı";
  if (followers > 0) return "Toplulukta takip edilen profil";
  return "Yeni müziksever";
}

export function compareProfileSuggestions(left: ProfileDiscoverySignals, right: ProfileDiscoverySignals) {
  return right.sharedGenres.length - left.sharedGenres.length ||
    right.followers - left.followers ||
    right.posts - left.posts;
}
