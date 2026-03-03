'use client';

import { useEffect, useMemo, useState } from 'react';

type Deck = { slug: string; name: string };

type PriceEntry = { market?: number };

type NeededRow = {
  key: string;
  name: string;
  set: string;
  number: string;
  needed: number;
  market?: number;
};

function fmtUSD(n?: number) {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function CollectionClient({
  decks,
  deckCards,
  prices,
}: {
  decks: Deck[];
  deckCards: Record<string, Array<{ key: string; name: string; set: string; number: string; count: number }>>;
  prices: Record<string, PriceEntry>;
}) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedSlugs = useMemo(
    () => decks.map((d) => d.slug).filter((s) => selected[s]),
    [decks, selected]
  );

  // Persistent state (loaded/saved via API)
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Record<string, number>>({});

  // Load persistent state
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/collection/state');
      if (!res.ok) return;
      const json = (await res.json()) as {
        selectedDecks: string[];
        owned: Record<string, number>;
        cart: Record<string, number>;
      };
      const sel: Record<string, boolean> = {};
      for (const s of json.selectedDecks) sel[s] = true;
      setSelected(sel);
      setOwned(json.owned ?? {});
      setCart(json.cart ?? {});
    })();
  }, []);

  async function persistSelected(next: Record<string, boolean>) {
    setSelected(next);
    const selectedDecks = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k]) => k);
    await fetch('/api/collection/selected-decks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ selectedDecks }),
    }).catch(() => null);
  }

  async function bumpOwned(cardKey: string, delta: number) {
    const next = Math.max(0, (owned[cardKey] ?? 0) + delta);
    setOwned((o) => ({ ...o, [cardKey]: next }));
    await fetch('/api/collection/owned', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardKey, ownedQty: next }),
    }).catch(() => null);
  }

  async function bumpCart(cardKey: string, delta: number) {
    const next = Math.max(0, (cart[cardKey] ?? 0) + delta);
    setCart((c) => ({ ...c, [cardKey]: next }));
    await fetch('/api/collection/cart', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardKey, qty: next }),
    }).catch(() => null);
  }

  const neededRows: NeededRow[] = useMemo(() => {
    const acc = new Map<string, NeededRow>();
    for (const slug of selectedSlugs) {
      const lines = deckCards[slug] ?? [];
      for (const l of lines) {
        const row = acc.get(l.key);
        if (!row) {
          acc.set(l.key, {
            key: l.key,
            name: l.name,
            set: l.set,
            number: l.number,
            needed: l.count,
            market: prices?.[l.key]?.market,
          });
        } else {
          row.needed += l.count;
        }
      }
    }
    return Array.from(acc.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [deckCards, prices, selectedSlugs]);

  const totals = useMemo(() => {
    let neededSubtotal = 0;
    let toBuySubtotal = 0;
    for (const r of neededRows) {
      const m = r.market;
      if (typeof m !== 'number') continue;
      neededSubtotal += m * r.needed;
      const toBuy = Math.max(0, r.needed - (owned[r.key] ?? 0));
      toBuySubtotal += m * toBuy;
    }
    return { neededSubtotal, toBuySubtotal };
  }, [neededRows, owned]);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Decks
        </div>
        <div className="mt-3 space-y-2">
          {decks.map((d) => (
            <label key={d.slug} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!selected[d.slug]}
                onChange={(e) => {
                  const next = { ...selected, [d.slug]: e.target.checked };
                  void persistSelected(next);
                }}
              />
              <span className="font-medium">{d.name}</span>
            </label>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
              Needed cards
            </div>
            <div className="mt-2 text-sm text-zinc-600">
              Selected decks: <span className="font-semibold">{selectedSlugs.length}</span> · Unique cards:{' '}
              <span className="font-semibold">{neededRows.length}</span>
            </div>
          </div>
          <div className="text-sm text-zinc-700">
            Needed: <span className="font-semibold">{fmtUSD(totals.neededSubtotal)}</span>{' '}
            · To buy: <span className="font-semibold">{fmtUSD(totals.toBuySubtotal)}</span>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Card</th>
                  <th className="px-4 py-3">Set</th>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Needed</th>
                  <th className="px-4 py-3">Owned</th>
                  <th className="px-4 py-3">To buy</th>
                  <th className="px-4 py-3">$</th>
                  <th className="px-4 py-3">Cart</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {neededRows.map((r) => {
                  const ownedQty = owned[r.key] ?? 0;
                  const toBuy = Math.max(0, r.needed - ownedQty);
                  return (
                    <tr key={r.key} className="align-top hover:bg-zinc-50">
                      <td className="px-4 py-4 font-semibold">{r.name}</td>
                      <td className="px-4 py-4">{r.set}</td>
                      <td className="px-4 py-4">{r.number}</td>
                      <td className="px-4 py-4 font-semibold tabular-nums">{r.needed}</td>
                      <td className="px-4 py-4 tabular-nums">
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                            onClick={() => void bumpOwned(r.key, -1)}
                          >
                            -
                          </button>
                          <span className="min-w-6 text-center">{ownedQty}</span>
                          <button
                            className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                            onClick={() => void bumpOwned(r.key, +1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold tabular-nums">{toBuy}</td>
                      <td className="px-4 py-4 tabular-nums">{fmtUSD(r.market)}</td>
                      <td className="px-4 py-4 tabular-nums">
                        <div className="flex items-center gap-2">
                          <button
                            className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                            onClick={() => void bumpCart(r.key, -1)}
                          >
                            -
                          </button>
                          <span className="min-w-6 text-center">{cart[r.key] ?? 0}</span>
                          <button
                            className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                            onClick={() => void bumpCart(r.key, +1)}
                          >
                            +
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!neededRows.length ? (
                  <tr>
                    <td className="px-4 py-8 text-zinc-500" colSpan={8}>
                      Select one or more decks to see needed cards.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-xs text-zinc-500">
          Persistence requires Supabase env vars: <code>SUPABASE_URL</code> and{' '}
          <code>SUPABASE_SERVICE_ROLE_KEY</code>.
        </div>
      </section>
    </div>
  );
}
