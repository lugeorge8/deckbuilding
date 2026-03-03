import { NextResponse } from 'next/server';

import { readDecks } from '@/lib/decksStore';
import { parseDeckText } from '@/lib/deckTextParser';
import { fetchLimitlessPrice } from '@/lib/limitless';
import { readCardsCache, writeCardsCache } from '@/lib/cardsStore';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const decks = await readDecks();

  // Collect unique set/number pairs across all decks
  const unique = new Map<string, { set: string; number: string }>();
  for (const d of decks) {
    const { lines } = parseDeckText(d.raw);
    for (const l of lines) unique.set(l.key, { set: l.set, number: l.number });
  }

  const cache = await readCardsCache();
  const results: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  // Sequential to be polite
  for (const [key, v] of unique.entries()) {
    try {
      const price = await fetchLimitlessPrice(v.set, v.number);
      cache.cards[key] = price;
      results[key] = true;
    } catch (e: unknown) {
      errors[key] = e instanceof Error ? e.message : 'unknown error';
    }
  }

  cache.refreshedAt = new Date().toISOString();
  await writeCardsCache(cache);

    return NextResponse.json({
      ok: true,
      refreshedAt: cache.refreshedAt,
      updated: Object.keys(results).length,
      errors,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'refresh failed' },
      { status: 500 }
    );
  }
}
