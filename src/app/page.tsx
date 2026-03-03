import Link from 'next/link';
import { readDecks } from '@/lib/decksStore';
import { readCardsCache } from '@/lib/cardsStore';
import { parseDeckText } from '@/lib/deckTextParser';

function fmtUSD(n?: number) {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default async function Home() {
  const decks = await readDecks();
  const cardsCache = await readCardsCache();

  const rows = decks.map((d) => {
    const parsed = parseDeckText(d.raw);

    const deckCost = parsed.lines.reduce((sum, l) => {
      const market = cardsCache.cards?.[l.key]?.market;
      return sum + (typeof market === 'number' ? market * l.count : 0);
    }, 0);

    const hasAnyPrice = parsed.lines.some(
      (l) => typeof cardsCache.cards?.[l.key]?.market === 'number'
    );

    return {
      ...d,
      totalCards: parsed.totalCards,
      refreshedAt: d.priceCache?.refreshedAt,
      deckCost: hasAnyPrice ? deckCost : undefined,
    };
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Pokemon decks</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Click a deck to see its card list and cached prices. Prices come from
              Limitless (TCGplayer-backed) and are only as fresh as the last
              refresh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/cards"
              className="inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              View unique cards
            </Link>
            <Link
              href="/collection"
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Collection planner
            </Link>
          </div>
        </header>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Deck</th>
                <th className="px-4 py-3 font-medium">Total cards</th>
                <th className="px-4 py-3 font-medium">Deck cost</th>
                <th className="px-4 py-3 font-medium">Last price refresh</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.slug} className="border-t border-zinc-100">
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/deck/${d.slug}`}>
                      {d.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{d.totalCards}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-900">
                    {fmtUSD(d.deckCost)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {d.refreshedAt ? new Date(d.refreshedAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-10 text-xs text-zinc-500">
          Note: on Vercel, writing back to decks.json from the refresh endpoint
          won’t persist long-term (serverless filesystem). For persistent caching,
          we’ll need KV/DB or run the refresh locally and commit.
        </footer>
      </main>
    </div>
  );
}
