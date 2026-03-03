import Link from 'next/link';

import { readDecks, type PriceEntry } from '@/lib/decksStore';
import { parseDeckText, type DeckCardLine } from '@/lib/deckTextParser';

type UniqueCard = {
  key: string;
  name: string;
  set: string;
  number: string;
  totalCount: number;
  market?: number;
  decks: Array<{ slug: string; name: string; count: number }>;
};

function sortCards(a: UniqueCard, b: UniqueCard) {
  // by name then set/number
  const an = a.name.localeCompare(b.name);
  if (an !== 0) return an;
  const as = a.set.localeCompare(b.set);
  if (as !== 0) return as;
  return a.number.localeCompare(b.number);
}

function fmtUSD(n?: number) {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function accumulateCard(
  map: Map<string, UniqueCard>,
  line: DeckCardLine,
  deck: { slug: string; name: string },
  price?: PriceEntry
) {
  const existing = map.get(line.key);
  if (!existing) {
    map.set(line.key, {
      key: line.key,
      name: line.name,
      set: line.set,
      number: line.number,
      totalCount: line.count,
      market: price?.market,
      decks: [{ slug: deck.slug, name: deck.name, count: line.count }],
    });
    return;
  }

  // keep the first seen market price, if any
  if (existing.market == null && typeof price?.market === 'number') {
    existing.market = price.market;
  }

  existing.totalCount += line.count;
  const d = existing.decks.find((x) => x.slug === deck.slug);
  if (d) d.count += line.count;
  else existing.decks.push({ slug: deck.slug, name: deck.name, count: line.count });
}

export default async function CardsPage() {
  const decks = await readDecks();

  const unique = new Map<string, UniqueCard>();
  for (const d of decks) {
    const parsed = parseDeckText(d.raw);
    for (const line of parsed.lines) {
      const price = d.priceCache?.cards?.[line.key];
      accumulateCard(unique, line, d, price);
    }
  }

  const cards = Array.from(unique.values()).sort(sortCards);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              deckbuilding
            </div>
            <div className="mt-1 text-xl font-semibold tracking-tight">Unique cards</div>
            <div className="mt-1 text-sm text-zinc-600">
              {cards.length} unique cards across {decks.length} decks
            </div>
          </div>

          <Link
            href="/"
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[900px] w-full text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Card</th>
                  <th className="px-4 py-3">Set</th>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">$ cost</th>
                  <th className="px-4 py-3">Decks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {cards.map((c) => (
                  <tr key={c.key} className="align-top hover:bg-zinc-50">
                    <td className="px-4 py-4 font-semibold">{c.name}</td>
                    <td className="px-4 py-4">{c.set}</td>
                    <td className="px-4 py-4">{c.number}</td>
                    <td className="px-4 py-4 font-semibold">{c.totalCount}</td>
                    <td className="px-4 py-4 tabular-nums">{fmtUSD(c.market)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {c.decks
                          .slice()
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((d) => (
                            <Link
                              key={d.slug}
                              href={`/deck/${encodeURIComponent(d.slug)}`}
                              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                              title={`${d.count} copies in ${d.name}`}
                            >
                              {d.name} ({d.count})
                            </Link>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-xs text-zinc-500">
          Note: this list is computed from <code>src/data/decks.json</code> and
          the deck text parser.
        </div>
      </main>
    </div>
  );
}
