'use client';

import { useEffect, useMemo, useState } from 'react';

type Meta = { name: string; set: string; number: string };

type PriceEntry = { market?: number };

function fmtUSD(n?: number) {
  if (typeof n !== 'number') return '—';
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function CartClient({
  meta,
  prices,
}: {
  meta: Record<string, Meta>;
  prices: Record<string, PriceEntry>;
}) {
  const [owned, setOwned] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/collection/state');
      if (!res.ok) return;
      const json = (await res.json()) as {
        owned: Record<string, number>;
        cart: Record<string, number>;
      };
      setOwned(json.owned ?? {});
      setCart(json.cart ?? {});
    })();
  }, []);

  async function setCartQty(cardKey: string, qty: number) {
    const next = Math.max(0, qty);
    setCart((c) => ({ ...c, [cardKey]: next }));
    await fetch('/api/collection/cart', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardKey, qty: next }),
    }).catch(() => null);
  }

  async function markAcquired(cardKey: string, qty: number) {
    const ownedNext = (owned[cardKey] ?? 0) + qty;
    setOwned((o) => ({ ...o, [cardKey]: ownedNext }));
    setCart((c) => ({ ...c, [cardKey]: 0 }));

    await fetch('/api/collection/acquire', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ cardKey, qty }),
    }).catch(() => null);
  }

  const items = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([key, qty]) => ({ key, qty, meta: meta[key], market: prices?.[key]?.market }))
      .sort((a, b) => (a.meta?.name ?? a.key).localeCompare(b.meta?.name ?? b.key));
  }, [cart, meta, prices]);

  const total = useMemo(() => {
    let sum = 0;
    for (const it of items) {
      if (typeof it.market === 'number') sum += it.market * it.qty;
    }
    return sum;
  }, [items]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Cart
          </div>
          <div className="mt-2 text-sm text-zinc-600">
            Items: <span className="font-semibold">{items.length}</span>
          </div>
        </div>
        <div className="text-sm text-zinc-700">
          Est. total: <span className="font-semibold">{fmtUSD(total)}</span>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-zinc-200">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-zinc-50 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              <tr>
                <th className="px-4 py-3">Card</th>
                <th className="px-4 py-3">Set</th>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">$</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {items.map((it) => (
                <tr key={it.key} className="hover:bg-zinc-50">
                  <td className="px-4 py-4 font-semibold">{it.meta?.name ?? it.key}</td>
                  <td className="px-4 py-4">{it.meta?.set ?? '—'}</td>
                  <td className="px-4 py-4">{it.meta?.number ?? '—'}</td>
                  <td className="px-4 py-4 tabular-nums">{it.qty}</td>
                  <td className="px-4 py-4 tabular-nums">{fmtUSD(it.market)}</td>
                  <td className="px-4 py-4 tabular-nums">
                    {typeof it.market === 'number' ? fmtUSD(it.market * it.qty) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                        onClick={() => void setCartQty(it.key, it.qty - 1)}
                      >
                        -1
                      </button>
                      <button
                        className="rounded-md border border-zinc-200 px-2 py-1 text-xs"
                        onClick={() => void setCartQty(it.key, 0)}
                      >
                        Clear
                      </button>
                      <button
                        className="rounded-md bg-zinc-900 px-2 py-1 text-xs font-semibold text-white"
                        onClick={() => void markAcquired(it.key, it.qty)}
                      >
                        Mark acquired
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      Owned after: {(owned[it.key] ?? 0) + it.qty}
                    </div>
                  </td>
                </tr>
              ))}

              {!items.length ? (
                <tr>
                  <td className="px-4 py-8 text-zinc-500" colSpan={7}>
                    Cart is empty.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
