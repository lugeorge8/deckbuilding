import path from 'path';
import fs from 'fs/promises';

import type { PriceEntry } from '@/lib/decksStore';

export type CardsCache = {
  refreshedAt: string | null;
  cards: Record<string, PriceEntry>; // key = `${set}-${number}`
};

const CARDS_PATH = path.join(process.cwd(), 'src', 'data', 'cards.json');

export async function readCardsCache(): Promise<CardsCache> {
  const s = await fs.readFile(CARDS_PATH, 'utf8');
  return JSON.parse(s);
}

export async function writeCardsCache(cache: CardsCache): Promise<void> {
  await fs.writeFile(CARDS_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8');
}
