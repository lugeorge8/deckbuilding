import Link from 'next/link';

import { readDecks, type PriceEntry } from '@/lib/decksStore';
import { readCardsCache } from '@/lib/cardsStore';
import { parseDeckText, type DeckCardLine } from '@/lib/deckTextParser';
import { RefreshAllButton } from './RefreshAllButton';

type CardBucket = 'pokemon' | 'trainer' | 'energy' | 'unknown';

type UniqueCard = {
  key: string;
  name: string;
  set: string;
  number: string;
  bucket: CardBucket;
  totalCount: number;
  market?: number;
  decks: Array<{ slug: string; name: string; count: number }>;
};

const BUCKET_LABEL: Record<CardBucket, string> = {
  pokemon: 'Pokémon',
  trainer: 'Trainers',
  energy: 'Energy',
  unknown: 'Other',
};

const BUCKET_ORDER: Record<CardBucket, number> = {
  pokemon: 1,
  trainer: 2,
  energy: 3,
  unknown: 4,
};

function normalizeBucket(section: DeckCardLine['section']): CardBucket {
  if (section === 'pokemon' || section === 'trainer' || section === 'energy') return section;
  return 'unknown';
}

function strongestBucket(a: CardBucket, b: CardBucket): CardBucket {
  return BUCKET_ORDER[a] <= BUCKET_ORDER[b] ? a : b;
}

function sortByName(a: UniqueCard, b: UniqueCard) {
  const an = a.name.localeCompare(b.name);
  if (an !== 0) return an;
  const as = a.set.localeCompare(b.set);
  if (as !== 0) return as;
  return a.number.localeCompare(b.number);
}

function sortBySet(a: UniqueCard, b: UniqueCard) {
  const as = a.set.localeCompare(b.set);
  if (as !== 0) return as;
  const an = a.name.localeCompare(b.name);
  if (an !== 0) return an;
  return a.number.localeCompare(b.number);
}

function sortByBucket(a: UniqueCard, b: UniqueCard) {
  const ab = BUCKET_ORDER[a.bucket] - BUCKET_ORDER[b.bucket];
  if (ab !== 0) return ab;
  return sortByName(a, b);
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
  const bucket = normalizeBucket(line.section);

  const existing = map.get(line.key);
  if (!existing) {
    map.set(line.key, {
      key: line.key,
      name: line.name,
      set: line.set,
      number: line.number,
      bucket,
      totalCount: line.count,
      market: price?.market,
      decks: [{ slug: deck.slug, name: deck.name, count: line.count }],
    });
    return;
  }

  // If a card shows up in multiple sections across decks, pick the strongest bucket.
  existing.bucket = strongestBucket(existing.bucket, bucket);

  // keep the first seen market price, if any
  if (existing.market == null && typeof price?.market === 'number') {
    existing.market = price.market;
  }

  existing.totalCount += line.count;
  const d = existing.decks.find((x) => x.slug === deck.slug);
  if (d) d.count += line.count;
  else existing.decks.push({ slug: deck.slug, name: deck.name, count: line.count });
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort } = await searchParams;
  const decks = await readDecks();
  const cardsCache = await readCardsCache();

  const unique = new Map<string, UniqueCard>();
  for (const d of decks) {
    const parsed = parseDeckText(d.raw);
    for (const line of parsed.lines) {
      const price = cardsCache.cards?.[line.key] ?? d.priceCache?.cards?.[line.key];
      accumulateCard(unique, line, d, price);
    }
  }

  const cards = Array.from(unique.values());
  const sortKey = sort === 'set' || sort === 'bucket' ? sort : 'name';
  cards.sort(sortKey === 'set' ? sortBySet : sortKey === 'bucket' ? sortByBucket : sortByName);

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
              {cardsCache.refreshedAt ? (
                <> · prices refreshed {new Date(cardsCache.refreshedAt).toLocaleString()}</>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <RefreshAllButton />
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-700">
            Sort by:{' '}
            <Link
              href="/cards?sort=name"
              className={`font-semibold underline ${sortKey === 'name' ? 'text-zinc-900' : 'text-zinc-600'}`}
            >
              name
            </Link>
            {' · '}
            <Link
              href="/cards?sort=set"
              className={`font-semibold underline ${sortKey === 'set' ? 'text-zinc-900' : 'text-zinc-600'}`}
            >
              set
            </Link>
            {' · '}
            <Link
              href="/cards?sort=bucket"
              className={`font-semibold underline ${sortKey === 'bucket' ? 'text-zinc-900' : 'text-zinc-600'}`}
            >
              bucket
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Card</th>
                  <th className="px-4 py-3">Set</th>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Bucket</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">$ cost</th>
                  <th className="px-4 py-3">Price updated</th>
                  <th className="px-4 py-3">Decks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {cards.map((c) => (
                  <tr key={c.key} className="align-top hover:bg-zinc-50">
                    <td className="px-4 py-4 font-semibold">{c.name}</td>
                    <td className="px-4 py-4">{c.set}</td>
                    <td className="px-4 py-4">{c.number}</td>
                    <td className="px-4 py-4 text-xs font-semibold text-zinc-700">
                      {BUCKET_LABEL[c.bucket]}
                    </td>
                    <td className="px-4 py-4 font-semibold">{c.totalCount}</td>
                    <td className="px-4 py-4 tabular-nums">{fmtUSD(c.market)}</td>
                    <td className="px-4 py-4 text-xs text-zinc-600">
                      {cardsCache.refreshedAt
                        ? new Date(cardsCache.refreshedAt).toLocaleDateString()
                        : '—'}
                    </td>
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
