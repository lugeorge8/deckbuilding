import { NextResponse } from 'next/server';
import { readDecks, writeDecks, type PriceEntry } from '@/lib/decksStore';
import { parseDeckText } from '@/lib/deckTextParser';
import { fetchLimitlessPrice } from '@/lib/limitless';

export const runtime = 'nodejs';

export async function POST(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const decks = await readDecks();
  const deck = decks.find((d) => d.slug === slug);
  if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });

  const { lines } = parseDeckText(deck.raw);
  const unique = new Map<string, { set: string; number: string }>();
  for (const l of lines) unique.set(l.key, { set: l.set, number: l.number });

  const results: Record<string, PriceEntry> = {};
  const errors: Record<string, string> = {};

  // Basic sequential fetch to be polite; can batch/parallel later.
  for (const [key, v] of unique.entries()) {
    try {
      results[key] = await fetchLimitlessPrice(v.set, v.number);
    } catch (e: unknown) {
      errors[key] = e instanceof Error ? e.message : 'unknown error';
    }
  }

  deck.priceCache.cards = { ...deck.priceCache.cards, ...results };
  deck.priceCache.refreshedAt = new Date().toISOString();

  // NOTE: writing to the repo file will persist locally; on Vercel this is ephemeral.
  await writeDecks(decks);

  return NextResponse.json({
    ok: true,
    slug,
    refreshedAt: deck.priceCache.refreshedAt,
    updated: Object.keys(results).length,
    errors,
  });
}
