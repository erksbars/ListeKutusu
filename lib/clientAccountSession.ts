"use client";

export type AccountSessionSummary = {
  id?: string;
  slug: string;
  ownerName: string;
  email?: string | null;
  role?: string | null;
  onboarding?: {
    profileComplete: boolean;
    feedPosts: number;
    feedLikes: number;
    feedAdds: number;
  };
};

type CacheEntry = {
  account: AccountSessionSummary | null;
  expiresAt: number;
};

const AUTHENTICATED_TTL = 60_000;
const ANONYMOUS_TTL = 10_000;

let cache: CacheEntry | null = null;
let inFlight: Promise<AccountSessionSummary | null> | null = null;

export function primeAccountSession(account: AccountSessionSummary | null) {
  cache = {
    account,
    expiresAt: Date.now() + (account ? AUTHENTICATED_TTL : ANONYMOUS_TTL),
  };
}

export function clearAccountSessionCache() {
  cache = null;
  inFlight = null;
}

export async function loadAccountSession(options: { force?: boolean } = {}) {
  const now = Date.now();
  if (!options.force && cache && cache.expiresAt > now) return cache.account;
  if (!options.force && inFlight) return inFlight;

  inFlight = fetch("/api/accounts/me?view=summary", {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  })
    .then(async (response) => {
      if (response.status === 401) {
        primeAccountSession(null);
        return null;
      }
      if (!response.ok) throw new Error("Oturum bilgisi alınamadı.");
      const data = await response.json().catch(() => null);
      const account = (data?.list ?? null) as AccountSessionSummary | null;
      primeAccountSession(account);
      return account;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
