import Link from 'next/link';

import { readDecks } from '@/lib/decksStore';
import { readCardsCache } from '@/lib/cardsStore';
import { parseDeckText } from '@/lib/deckTextParser';

import { CollectionClient } from './ui';

export default async function CollectionPage() {
  const decks = await readDecks();
  const cardsCache = await readCardsCache();

  const deckCards: Record<string, Array<{ key: string; name: string; set: string; number: string; count: number }>> = {};
  for (const d of decks) {
    const { lines } = parseDeckText(d.raw);
    deckCards[d.slug] = lines.map((l) => ({
      key: l.key,
      name: l.name,
      set: l.set,
      number: l.number,
      count: l.count,
    }));
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm underline text-zinc-700" href="/">
              ← All decks
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Collection planner</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Select decks → see combined needed cards → track owned + cart.
            </p>
          </div>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Shopping cart
          </Link>
        </header>

        <CollectionClient
          decks={decks.map((d) => ({ slug: d.slug, name: d.name }))}
          deckCards={deckCards}
          prices={cardsCache.cards}
        />
      </main>
    </div>
  );
}
