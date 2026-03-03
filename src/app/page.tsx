import Link from 'next/link';
import { readDecks } from '@/lib/decksStore';
import { parseDeckText } from '@/lib/deckTextParser';

export default async function Home() {
  const decks = await readDecks();

  const rows = decks.map((d) => {
    const parsed = parseDeckText(d.raw);
    return {
      ...d,
      totalCards: parsed.totalCards,
      refreshedAt: d.priceCache?.refreshedAt,
    };
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Pokemon decks</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Click a deck to see its card list and cached prices. Prices come from
            Limitless (TCGplayer-backed) and are only as fresh as the last
            refresh.
          </p>
        </header>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-100 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Deck</th>
                <th className="px-4 py-3 font-medium">Total cards</th>
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
