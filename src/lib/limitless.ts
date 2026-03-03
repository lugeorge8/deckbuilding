import { PriceEntry } from './decksStore';

export type LimitlessCardResponse = {
  name?: string;
  set?: { code?: string };
  number?: string;

  // Newer Limitless API shape
  market_price?: number;
  low_price?: number;
  mid_price?: number;
  high_price?: number;

  // Older Limitless API shape (tcgplayer prices)
  tcgplayer?: {
    prices?: {
      normal?: { market?: number; low?: number; mid?: number; high?: number };
      holofoil?: { market?: number; low?: number; mid?: number; high?: number };
      reverseHolofoil?: { market?: number; low?: number; mid?: number; high?: number };
      firstEditionHolofoil?: { market?: number; low?: number; mid?: number; high?: number };
    };
  };
};

function pickPrice(resp: LimitlessCardResponse): PriceEntry {
  // Prefer the newer top-level market_price fields if present
  if (typeof resp?.market_price === 'number') {
    return {
      market: resp.market_price,
      low: typeof resp.low_price === 'number' ? resp.low_price : undefined,
      mid: typeof resp.mid_price === 'number' ? resp.mid_price : undefined,
      high: typeof resp.high_price === 'number' ? resp.high_price : undefined,
    };
  }

  const prices = resp?.tcgplayer?.prices;
  const variant =
    prices?.normal ??
    prices?.holofoil ??
    prices?.reverseHolofoil ??
    prices?.firstEditionHolofoil;

  if (!variant) return {};
  const { market, low, mid, high } = variant;
  return {
    market: typeof market === 'number' ? market : undefined,
    low: typeof low === 'number' ? low : undefined,
    mid: typeof mid === 'number' ? mid : undefined,
    high: typeof high === 'number' ? high : undefined,
  };
}

export async function fetchLimitlessPrice(set: string, number: string): Promise<PriceEntry> {
  const url = `https://limitlesstcg.com/api/cards/${encodeURIComponent(set)}/${encodeURIComponent(number)}`;
  const res = await fetch(url, {
    // avoid Next caching for refresh endpoint
    cache: 'no-store',
    headers: { 'user-agent': 'pokemon-deck-deckbuilder/1.0' },
  });

  if (!res.ok) {
    throw new Error(`Limitless fetch failed: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as LimitlessCardResponse;
  return pickPrice(json);
}
