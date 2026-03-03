import { PriceEntry } from './decksStore';

export type LimitlessCardResponse = {
  name?: string;
  set?: { code?: string };
  number?: string;
  tcgplayer?: {
    prices?: {
      normal?: {
        market?: number;
        low?: number;
        mid?: number;
        high?: number;
      };
      holofoil?: {
        market?: number;
        low?: number;
        mid?: number;
        high?: number;
      };
      reverseHolofoil?: {
        market?: number;
        low?: number;
        mid?: number;
        high?: number;
      };
      firstEditionHolofoil?: {
        market?: number;
        low?: number;
        mid?: number;
        high?: number;
      };
    };
  };
};

function pickPrice(resp: LimitlessCardResponse): PriceEntry {
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
