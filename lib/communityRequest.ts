export class CommunityRequestError extends Error {
  readonly status: number;
  constructor(message: string, status: number) { super(message); this.name = "CommunityRequestError"; this.status = status; }
}

export function communityRequestStatus(error: unknown): number | null {
  return error instanceof CommunityRequestError ? error.status : null;
}

export async function communityFetch<T>(url: string, body?: Record<string, unknown>, signal?: AbortSignal, method: "POST" | "PATCH" = "POST"): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal, ...(body ? { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {}) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new CommunityRequestError(typeof data?.error === "string" ? data.error : "İşlem tamamlanamadı.", response.status);
  if (data === null) throw new Error("Sunucudan geçerli yanıt alınamadı. Yeniden dene.");
  return data as T;
}

export const communityError = (error: unknown) => error instanceof Error && !(error instanceof TypeError) && !(error instanceof SyntaxError) ? error.message : "İşlem tamamlanamadı. Bağlantını kontrol edip tekrar dene.";
