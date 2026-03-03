import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findDeck } from '@/lib/decksStore';
import { groupBySection, parseDeckText } from '@/lib/deckTextParser';
import { RefreshButton } from './RefreshButton';

function fmtUSD(n?: number) {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default async function DeckPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const deck = await findDeck(slug);
  if (!deck) return notFound();

  const parsed = parseDeckText(deck.raw);
  const grouped = groupBySection(parsed.lines);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-6">
          <div>
            <Link className="text-sm underline text-zinc-700" href="/">
              ← All decks
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">{deck.name}</h1>
            <div className="mt-1 text-sm text-zinc-600">
              Total cards: {parsed.totalCards}
              {deck.priceCache?.refreshedAt ? (
                <> · Last refreshed: {new Date(deck.priceCache.refreshedAt).toLocaleString()}</>
              ) : (
                <> · Last refreshed: —</>
              )}
            </div>
          </div>
          <RefreshButton slug={deck.slug} />
        </div>

        <div className="space-y-8">
          {(
            [
              ['Pokémon', grouped.pokemon],
              ['Trainers', grouped.trainer],
              ['Energy', grouped.energy],
              ['Pokémon', grouped.unknown],
            ] as const
          )
            .filter(([, lines]) => lines.length > 0)
            .map(([label, lines]) => (
              <section key={label} className="rounded-lg border border-zinc-200 bg-white">
                <header className="border-b border-zinc-100 px-4 py-3">
                  <h2 className="text-sm font-semibold">{label}</h2>
                </header>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50 text-left">
                      <tr>
                        <th className="px-4 py-2 font-medium">Count</th>
                        <th className="px-4 py-2 font-medium">Card</th>
                        <th className="px-4 py-2 font-medium">Set</th>
                        <th className="px-4 py-2 font-medium">#</th>
                        <th className="px-4 py-2 font-medium">Market</th>
                        <th className="px-4 py-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((l) => {
                        const price = deck.priceCache?.cards?.[l.key];
                        const market = price?.market;
                        const total = typeof market === 'number' ? market * l.count : undefined;
                        return (
                          <tr key={l.key + '-' + l.name} className="border-t border-zinc-100">
                            <td className="px-4 py-2 tabular-nums">{l.count}</td>
                            <td className="px-4 py-2">{l.name}</td>
                            <td className="px-4 py-2">{l.set}</td>
                            <td className="px-4 py-2">{l.number}</td>
                            <td className="px-4 py-2 tabular-nums">{fmtUSD(market)}</td>
                            <td className="px-4 py-2 tabular-nums">{fmtUSD(total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
        </div>
      </main>
    </div>
  );
}
