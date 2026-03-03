import path from 'path';
import fs from 'fs/promises';

export type PriceEntry = {
  // Prices are in USD (number) when available.
  market?: number;
  low?: number;
  mid?: number;
  high?: number;
};

export type DeckRecord = {
  name: string;
  slug: string;
  sourceChannelId?: string;
  raw: string;
  priceCache: {
    refreshedAt: string | null;
    cards: Record<string, PriceEntry>; // key = `${set}-${number}`
  };
};

const DECKS_PATH = path.join(process.cwd(), 'src', 'data', 'decks.json');

export async function readDecks(): Promise<DeckRecord[]> {
  const s = await fs.readFile(DECKS_PATH, 'utf8');
  return JSON.parse(s);
}

export async function writeDecks(decks: DeckRecord[]): Promise<void> {
  await fs.writeFile(DECKS_PATH, JSON.stringify(decks, null, 2) + '\n', 'utf8');
}

export async function findDeck(slug: string): Promise<DeckRecord | null> {
  const decks = await readDecks();
  return decks.find((d) => d.slug === slug) ?? null;
}
