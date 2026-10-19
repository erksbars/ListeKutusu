export type CommunityReadSnapshot<T> = { key: string; data: T | null; error: string; status?: number | null };
export function communityReadStatus<T>(snapshot: CommunityReadSnapshot<T> | null, key: string, enabled: boolean) {
  return enabled && snapshot?.key === key ? snapshot.status ?? null : null;
}
export function communityReadKey(url: string | null, revision: string | number) {
  return JSON.stringify([url, revision]);
}
export function communityReadState<T>(snapshot: CommunityReadSnapshot<T> | null, key: string, enabled: boolean) {
  if (!enabled) return { data: null, error: "", loading: false };
  if (!snapshot || snapshot.key !== key) return { data: null, error: "", loading: true };
  return { data: snapshot.data, error: snapshot.error, loading: false };
}
