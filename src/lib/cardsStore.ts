import path from 'path';
import fs from 'fs/promises';

import type { PriceEntry } from '@/lib/decksStore';

export type CardsCache = {
  refreshedAt: string | null;
  cards: Record<string, PriceEntry>; // key = `${set}-${number}`
};

const CARDS_PATH = path.join(process.cwd(), 'src', 'data', 'cards.json');

// In serverless (e.g. Vercel), the filesystem is read-only at runtime.
// Keep a best-effort in-memory cache so refresh still works during a warm instance.
let memoryCache: CardsCache | null = null;

export async function readCardsCache(): Promise<CardsCache> {
  if (memoryCache) return memoryCache;

  try {
    const s = await fs.readFile(CARDS_PATH, 'utf8');
    const parsed = JSON.parse(s) as CardsCache;
    memoryCache = parsed;
    return parsed;
  } catch {
    // if file is missing/unreadable, fall back to empty cache
    const empty: CardsCache = { refreshedAt: null, cards: {} };
    memoryCache = empty;
    return empty;
  }
}

export async function writeCardsCache(cache: CardsCache): Promise<void> {
  memoryCache = cache;
  try {
    await fs.writeFile(CARDS_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8');
  } catch {
    // ignore write errors (EROFS on serverless). memoryCache keeps the data.
  }
}
