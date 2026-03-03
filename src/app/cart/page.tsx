import Link from 'next/link';

import { readDecks } from '@/lib/decksStore';
import { readCardsCache } from '@/lib/cardsStore';
import { parseDeckText } from '@/lib/deckTextParser';

import { CartClient } from './ui';

export default async function CartPage() {
  const decks = await readDecks();
  const cardsCache = await readCardsCache();

  // card metadata lookup from all decks
  const meta = new Map<string, { name: string; set: string; number: string }>();
  for (const d of decks) {
    const { lines } = parseDeckText(d.raw);
    for (const l of lines) {
      if (!meta.has(l.key)) meta.set(l.key, { name: l.name, set: l.set, number: l.number });
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm underline text-zinc-700" href="/collection">
              ← Back to collection
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Shopping cart</h1>
            <p className="mt-2 text-sm text-zinc-600">Persistent cart + mark acquired.</p>
          </div>
        </header>

        <CartClient meta={Object.fromEntries(meta)} prices={cardsCache.cards} />
      </main>
    </div>
  );
}
