'use client';

import { useState } from 'react';

export function RefreshButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/decks/${encodeURIComponent(slug)}/refresh`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'refresh failed');
      setMsg(`Refreshed (${json.updated} cards). Reload to see updated cache.`);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'refresh failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={refresh}
        disabled={loading}
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? 'Refreshing…' : 'Refresh prices'}
      </button>
      {msg ? <span className="text-sm text-zinc-600">{msg}</span> : null}
    </div>
  );
}
