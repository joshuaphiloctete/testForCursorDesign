export type Token = {
  id: string; // CoinGecko id
  name: string;
  symbol: string;
  color: string;
};

export type TokenQuote = {
  usd: number;
  usd_24h_change?: number;
};

export type TokenQuotesById = Record<string, TokenQuote | undefined>;

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function fetchUsdQuotesById(opts: {
  tokenIds: string[];
  timeoutMs?: number;
}): Promise<TokenQuotesById> {
  const tokenIds = Array.from(new Set(opts.tokenIds)).filter(Boolean);
  const timeoutMs = opts.timeoutMs ?? 10_000;

  if (tokenIds.length === 0) return {};

  const url =
    `${COINGECKO_BASE}/simple/price` +
    `?ids=${encodeURIComponent(tokenIds.join(","))}` +
    `&vs_currencies=usd` +
    `&include_24hr_change=true`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`CoinGecko error: ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as TokenQuotesById;
    return json ?? {};
  } finally {
    clearTimeout(timeout);
  }
}

